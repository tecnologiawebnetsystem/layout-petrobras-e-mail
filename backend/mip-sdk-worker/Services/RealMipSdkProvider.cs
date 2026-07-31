using Microsoft.InformationProtection;
using Microsoft.InformationProtection.File;
using Microsoft.InformationProtection.Protection;
using Microsoft.InformationProtection.Exceptions;
using Microsoft.Extensions.Options;
using MipSdkWorker.Contracts;
using MipSdkWorker.Options;
using MipSdkWorker.Services.Auth;
using System.IO.Compression;
using System.Xml.Linq;

namespace MipSdkWorker.Services;

/// <summary>
/// Provider real do MIP SDK.
/// Registrado quando PlaceholderModeEnabled = false.
/// </summary>
public sealed class RealMipSdkProvider : IMipSdkProvider, IDisposable
{
    private readonly ILogger<RealMipSdkProvider> _logger;
    private readonly ILoggerFactory _loggerFactory;
    private readonly EntraIdOptions _entraId;
    private readonly MipWorkerOptions _mipOpts;

    private MipContext? _mipContext;
    private IFileProfile? _fileProfile;
    private IFileEngine? _fileEngine;          // ProtectionOnlyEngine = true  (SP, sem UnifiedPolicy)
    private IFileEngine? _policyEngine;        // ProtectionOnlyEngine = false (SP, requer UnifiedPolicy.Tenant.Read)
    private readonly SemaphoreSlim _initLock = new(1, 1);
    private readonly SemaphoreSlim _policyInitLock = new(1, 1);

    private static bool _mipInitialized;
    private static readonly object _mipInitLock = new();
    private bool _initialized;
    private bool _policyInitialized;

    public RealMipSdkProvider(
        ILogger<RealMipSdkProvider> logger,
        ILoggerFactory loggerFactory,
        IOptions<EntraIdOptions> entraId,
        IOptions<MipWorkerOptions> mipOpts)
    {
        _logger = logger;
        _loggerFactory = loggerFactory;
        _entraId = entraId.Value;
        _mipOpts = mipOpts.Value;
    }

    private async Task<T> RetryAsync<T>(Func<Task<T>> action, int retries = 3)
    {
        Exception? last = null;

        for (int i = 0; i < retries; i++)
        {
            try
            {
                return await action();
            }
            catch (AccessDeniedException)
            {
                // Erro determinístico (inclui NoPermissionsException) — não adianta retentar
                throw;
            }
            catch (Exception ex) when (i < retries - 1)
            {
                last = ex;
                _logger.LogWarning(ex,
                    "Tentativa {Attempt}/{Max} falhou. Aguardando antes de retentar.",
                    i + 1, retries);
                await Task.Delay(TimeSpan.FromMilliseconds(500 * (i + 1)));
            }
        }

        throw last ?? new Exception("Falha após múltiplas tentativas.");
    }

    // =========================================================================
    // EnsureFileEngineInitializedAsync
    // Inicializa MipContext, FileProfile e FileEngine (ProtectionOnlyEngine=true).
    // NÃO requer UnifiedPolicy.Tenant.Read — funciona para remove-label e user-auth.
    // =========================================================================

    private async Task EnsureFileEngineInitializedAsync(CancellationToken ct)
    {
        if (_initialized) return;

        await _initLock.WaitAsync(ct);
        try
        {
            if (_initialized) return;

            _logger.LogInformation(
                "Inicializando MIP SDK FileEngine (TenantId={TenantId} ClientId={ClientId})",
                _entraId.TenantId, _entraId.ClientId);

            // ApplicationInfo identifica o aplicativo no Azure AD / Purview
            var appInfo = new ApplicationInfo
            {
                ApplicationId = _entraId.ClientId,
                ApplicationName = "csa-mip-sdk-worker",
                ApplicationVersion = "1.0.0",
            };

            // MipComponent.File é necessário para trabalhar com .docx/.xlsx/.pdf
            lock (_mipInitLock)
            {
                if (!_mipInitialized)
                {
                    MIP.Initialize(MipComponent.File);
                    _mipInitialized = true;
                }
            }

            var authDelegate = new MipAuthDelegate(
                _entraId.TenantId,
                _entraId.ClientId,
                _entraId.ClientSecret,
                _loggerFactory.CreateLogger<MipAuthDelegate>());

            // MipConfiguration — InMemory evita escrita em disco no container
            var mipConfig = new MipConfiguration(
                appInfo,
                "mip_data",
                Microsoft.InformationProtection.LogLevel.Warning,
                false,
                CacheStorageType.InMemory);

            _mipContext = MIP.CreateMipContext(mipConfig);

            // Profile
            var profileSettings = new FileProfileSettings(
                _mipContext,
                CacheStorageType.InMemory,
                new ConsentDelegate());

            _fileProfile = await MIP.LoadFileProfileAsync(profileSettings);

            // ── FileEngine (ProtectionOnlyEngine = true) ───────────────────────
            // Não requer UnifiedPolicy.Tenant.Read.
            // Usado por: RemoveLabelAndProtectionAsync, RemoveLabelAndProtectionAsUserAsync,
            //            ChangeLabelAsUserAsync.
            var engineSettings = new FileEngineSettings(
                _entraId.ClientId,
                authDelegate,
                "",
                "pt-BR")
            {
                Identity = new Identity(_entraId.ClientId),
                ProtectionOnlyEngine = true,
            };

            _fileEngine = await RetryAsync(() =>
                _fileProfile.AddEngineAsync(engineSettings));

            _initialized = true;
            _logger.LogInformation("MIP SDK FileEngine inicializado com sucesso.");
        }
        catch (AccessDeniedException ex)
        {
            _logger.LogError(ex,
                "Acesso negado ao inicializar MIP SDK FileEngine. Verifique: " +
                "1) Content.SuperUser no App Registration (admin consent) " +
                "2) Enable-AipServiceSuperUser no tenant " +
                "3) Add-AipServiceSuperUser -ServicePrincipalId {ClientId}",
                _entraId.ClientId);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao inicializar MIP SDK FileEngine.");
            throw;
        }
        finally
        {
            _initLock.Release();
        }
    }

    // =========================================================================
    // EnsurePolicyEngineInitializedAsync
    // Inicializa PolicyEngine (ProtectionOnlyEngine=false) de forma lazy.
    // Requer: UnifiedPolicy.Tenant.Read (Microsoft Information Protection Sync Service).
    // Chamado apenas por ChangeLabelAsync — não bloqueia os outros fluxos.
    // =========================================================================

    private async Task EnsurePolicyEngineInitializedAsync(CancellationToken ct)
    {
        // Garante que o FileEngine base (MipContext, FileProfile) já existe
        await EnsureFileEngineInitializedAsync(ct);

        if (_policyInitialized) return;

        await _policyInitLock.WaitAsync(ct);
        try
        {
            if (_policyInitialized) return;

            _logger.LogInformation("Inicializando MIP SDK PolicyEngine (requer UnifiedPolicy.Tenant.Read)...");

            var authDelegate = new MipAuthDelegate(
                _entraId.TenantId,
                _entraId.ClientId,
                _entraId.ClientSecret,
                _loggerFactory.CreateLogger<MipAuthDelegate>());

            // ── PolicyEngine (ProtectionOnlyEngine = false) ────────────────────
            // Requer: UnifiedPolicy.Tenant.Read (Microsoft Information Protection Sync Service).
            // Permite: listar labels do tenant e aplicar via AssignmentMethod.Privileged.
            // Usado apenas por: ChangeLabelAsync (SP auth).
            var policyEngineSettings = new FileEngineSettings(
                _entraId.ClientId + "-policy",
                authDelegate,
                "",
                "pt-BR")
            {
                Identity = new Identity(_entraId.ClientId),
                ProtectionOnlyEngine = false,
            };

            _policyEngine = await RetryAsync(() =>
                _fileProfile!.AddEngineAsync(policyEngineSettings));

            _policyInitialized = true;
            _logger.LogInformation("MIP SDK PolicyEngine inicializado com sucesso.");
        }
        catch (AccessDeniedException ex)
        {
            _logger.LogError(ex,
                "Acesso negado ao inicializar PolicyEngine. " +
                "Verifique: UnifiedPolicy.Tenant.Read (Microsoft Information Protection Sync Service) " +
                "concedido com Admin Consent para ClientId={ClientId}. " +
                "Também requer Label Policy publicada para a conta de serviço no Purview.",
                _entraId.ClientId);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao inicializar MIP SDK PolicyEngine.");
            throw;
        }
        finally
        {
            _policyInitLock.Release();
        }
    }

    // =========================================================================
    // RemoveLabelAndProtectionAsync
    // =========================================================================

    public async Task<byte[]> RemoveLabelAndProtectionAsync(
        string fileName,
        byte[] fileContent,
        CancellationToken cancellationToken = default)
    {
        await EnsureFileEngineInitializedAsync(cancellationToken);

        _logger.LogInformation("Processando: {FileName} ({Size} bytes)",
            fileName, fileContent.Length);

        using var inputStream = new MemoryStream(fileContent);
        using var outputStream = new MemoryStream();

        // Cria o FileHandler a partir do stream.
        // NoPermissionsException = arquivo RMS-criptografado sem direitos na SP.
        IFileHandler handler;
        try
        {
            handler = await RetryAsync(() =>
                _fileEngine!.CreateFileHandlerAsync(
                    inputStream,
                    fileName,
                    isAuditDiscoveryEnabled: true));
        }
        catch (NoPermissionsException ex)
        {
            // Arquivo protegido pelo RMS e a SP não tem direitos (nem SuperUser).
            // Lança UnauthorizedAccessException para que o controller devolva 422.
            throw new UnauthorizedAccessException(
                $"O arquivo '{fileName}' está protegido com criptografia RMS e não pode ser " +
                $"processado automaticamente. Owner={ex.Owner ?? "desconhecido"}. " +
                "Solicite ao proprietário que remova a proteção antes de fazer o upload.", ex);
        }

        // Verifica se há proteção ou label.
        // ProtectionOnlyEngine=true lança NotSupportedException ao acessar handler.Label
        // em arquivos que têm apenas rótulo de classificação (sem criptografia RMS).
        bool temLabel;
        bool temProtecao;
        try
        {
            temLabel    = handler.Label      != null;
            temProtecao = handler.Protection != null;
        }
        catch (NotSupportedException)
        {
            // Arquivo tem apenas label de classificação — sem proteção RMS.
            // ProtectionOnlyEngine não consegue inspecionar labels via Policy Handler.
            // Rótulos Interno/Público sem criptografia: devolver o arquivo original intacto.
            // A mudança de rótulo (ex: para Público Externo) ocorre apenas no fluxo de
            // compartilhamento aprovado, não no momento do upload.
            try { temProtecao = handler.Protection != null; }
            catch { temProtecao = false; }

            if (!temProtecao)
            {
                _logger.LogInformation(
                    "{FileName}: label-only sem criptografia RMS (Interno/Público). " +
                    "Devolvendo arquivo original intacto — sem alteração de rótulo no upload.",
                    fileName);
                handler.Dispose();
                return fileContent;
            }

            // Tem proteção, mas label não é legível — remove só a proteção
            temLabel = false;
        }

        // Garante que o handler seja descartado ao sair do método
        using var _handler = handler;

        if (!temLabel && !temProtecao)
        {
            _logger.LogInformation(
                "Arquivo {FileName} não tem label nem proteção. Retornando original.",
                fileName);
            return fileContent;
        }

        // ── Loga o que foi encontrado ──────────────────────────────────────────
        if (temLabel)
        {
            _logger.LogInformation(
                "Label encontrado: {LabelName} ({LabelId})",
                handler.Label!.Label.Name, handler.Label.Label.Id);
        }

        if (temProtecao)
        {
            // Valida direitos antes de operar
            var hasExport = handler.Protection!.AccessCheck(Rights.Export);
            var isOwner = handler.Protection!.AccessCheck(Rights.Owner);

            _logger.LogInformation(
                "Proteção RMS detectada em {FileName}. Export={HasExport} Owner={IsOwner}",
                fileName, hasExport, isOwner);

            if (!hasExport && !isOwner)
            {
                throw new UnauthorizedAccessException(
                    $"Service principal não tem direito EXPORT ou OWNER sobre '{fileName}'. " +
                    "Verifique: Content.SuperUser + Enable-AipServiceSuperUser no tenant.");
            }
        }

        // ── Remove label (com suporte a downgrade) ────────────────────────────
        if (temLabel)
        {
            try
            {
                handler.DeleteLabel(new LabelingOptions
                {
                    AssignmentMethod = AssignmentMethod.Privileged,
                    JustificationMessage = "Removido automaticamente pelo sistema CSA.",
                });
            }
            catch (JustificationRequiredException)
            {
                _logger.LogWarning(
                    "Label requer justificativa para downgrade. Forçando IsDowngradeJustified.");
                handler.DeleteLabel(new LabelingOptions
                {
                    AssignmentMethod = AssignmentMethod.Privileged,
                    IsDowngradeJustified = true,
                    JustificationMessage = "Removido automaticamente pelo sistema CSA.",
                });
            }
        }

        // ── Remove proteção RMS ───────────────────────────────────────────────
        if (temProtecao)
        {
            handler.RemoveProtection();
        }

        // ── Commit ────────────────────────────────────────────────────────────
        var committed = await RetryAsync(() =>
            handler.CommitAsync(outputStream));

        if (!committed)
        {
            throw new InvalidOperationException(
                $"MIP SDK retornou false no CommitAsync para '{fileName}'.");
        }

        _logger.LogInformation(
            "Processamento concluído: {FileName} ({OriginalSize} → {NewSize} bytes)",
            fileName, fileContent.Length, outputStream.Length);

        return outputStream.ToArray();
    }

    // =========================================================================
    // ChangeLabelAsync
    // Altera rótulo via Service Principal usando PolicyEngine (ProtectionOnlyEngine=false).
    //
    // ESCOPO DE APLICAÇÃO:
    //   Aplica-se APENAS a arquivos com proteção RMS (rótulo Confidencial com criptografia).
    //   Arquivos sem proteção RMS (rótulos Interno, Público) NÃO são processados —
    //   são devolvidos sem modificação, pois a mudança de rótulo delegada pelo usuário
    //   não é necessária nesses casos.
    //
    // PRÉ-REQUISITOS NO AZURE AD (app A12022):
    //   - UnifiedPolicy.Tenant.Read  (Microsoft Information Protection Sync Service) — Application
    //   - Content.DelegatedWriter    (Azure Rights Management Services) — Application
    //   - Content.SuperUser          (via Enable-AipServiceSuperUser + Add-AipServiceSuperUser)
    //   - Label Policy publicada para a conta de serviço no portal Purview
    // =========================================================================

    public async Task<byte[]> ChangeLabelAsync(
        ChangeLabelRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsurePolicyEngineInitializedAsync(cancellationToken);

        _logger.LogInformation(
            "ChangeLabelAsync (SP): {FileName} → {TargetLabel}",
            request.FileName, request.TargetLabelImmutableId);

        if (string.IsNullOrWhiteSpace(request.TargetLabelImmutableId))
            throw new InvalidOperationException("TargetLabelImmutableId é obrigatório para ChangeLabelAsync.");

        using var inputStream  = new MemoryStream(request.FileContent);
        using var outputStream = new MemoryStream();

        // Cria o handler com o PolicyEngine (ProtectionOnlyEngine = false)
        IFileHandler handler;
        try
        {
            handler = await RetryAsync(() =>
                _policyEngine!.CreateFileHandlerAsync(
                    inputStream,
                    request.FileName,
                    isAuditDiscoveryEnabled: true));
        }
        catch (NoPermissionsException ex)
        {
            throw new UnauthorizedAccessException(
                $"O arquivo '{request.FileName}' está protegido com criptografia RMS e o SP não tem " +
                $"direitos. Owner={ex.Owner ?? "desconhecido"}. " +
                "Verifique: Content.SuperUser + Enable-AipServiceSuperUser no tenant.", ex);
        }

        using var _h = handler;

        // ── Verifica se há proteção RMS ────────────────────────────────────────
        // Regra de negócio: ChangeLabelAsync (via SP) aplica-se SOMENTE a arquivos
        // com criptografia RMS (Confidencial). Arquivos sem proteção (Interno, Público)
        // são devolvidos intactos — não há necessidade de mudança de rótulo via SP nesses casos.
        bool temProtecao;
        try { temProtecao = handler.Protection != null; }
        catch (NotSupportedException) { temProtecao = false; }

        if (!temProtecao)
        {
            _logger.LogInformation(
                "ChangeLabelAsync: {FileName} sem proteção RMS (rótulo Interno/Público). " +
                "Devolvendo arquivo original sem modificação.",
                request.FileName);
            return request.FileContent;
        }

        // Valida direitos da SP sobre o arquivo protegido
        var hasExport = handler.Protection!.AccessCheck(Rights.Export);
        var isOwner   = handler.Protection!.AccessCheck(Rights.Owner);
        _logger.LogInformation(
            "{FileName}: proteção RMS detectada — Export={Export} Owner={Owner}",
            request.FileName, hasExport, isOwner);

        if (!hasExport && !isOwner)
            throw new UnauthorizedAccessException(
                $"Service principal não tem direitos EXPORT/OWNER sobre '{request.FileName}'. " +
                "Verifique: Content.SuperUser + Enable-AipServiceSuperUser no tenant.");

        // ── Localiza o rótulo alvo na política do tenant ───────────────────────
        var labels      = _policyEngine!.SensitivityLabels;
        var targetLabel = FindLabelById(labels, request.TargetLabelImmutableId!);

        if (targetLabel == null)
        {
            var labelList = string.Join(", ", labels.Select(l => $"{l.Name}({l.Id})"));
            throw new InvalidOperationException(
                $"Rótulo '{request.TargetLabelImmutableId}' não encontrado na política do tenant. " +
                $"Labels disponíveis: {labelList}. " +
                "Verifique se a Label Policy está publicada para a conta de serviço.");
        }

        _logger.LogInformation(
            "ChangeLabelAsync: aplicando rótulo '{LabelName}' em {FileName}",
            targetLabel.Name, request.FileName);

        // ── Remove proteção RMS existente ──────────────────────────────────────
        handler.RemoveProtection();

        // ── Aplica novo rótulo via AssignmentMethod.Privileged ─────────────────
        var labelOptions = new LabelingOptions
        {
            AssignmentMethod     = AssignmentMethod.Privileged,
            IsDowngradeJustified = true,
            JustificationMessage = "Rótulo alterado automaticamente pelo sistema CSA para compartilhamento externo.",
        };

        try
        {
            handler.SetLabel(targetLabel, labelOptions, new ProtectionSettings());
        }
        catch (JustificationRequiredException)
        {
            handler.SetLabel(targetLabel, new LabelingOptions
            {
                AssignmentMethod     = AssignmentMethod.Privileged,
                IsDowngradeJustified = true,
                JustificationMessage = "Rótulo alterado automaticamente pelo sistema CSA.",
            }, new ProtectionSettings());
        }

        // ── Commit ────────────────────────────────────────────────────────────
        var committed = await RetryAsync(() => handler.CommitAsync(outputStream));
        if (!committed)
            throw new InvalidOperationException($"CommitAsync retornou false para '{request.FileName}'.");

        var result = outputStream.ToArray();
        _logger.LogInformation(
            "ChangeLabelAsync concluído: {FileName} ({Orig}→{Final} bytes)",
            request.FileName, request.FileContent.Length, result.Length);

        return result;
    }

    private static Microsoft.InformationProtection.Label? FindLabelById(
        IEnumerable<Microsoft.InformationProtection.Label> labels, string id)
    {
        foreach (var label in labels)
        {
            if (label.Id.Equals(id, StringComparison.OrdinalIgnoreCase))
                return label;
            // Busca recursiva em sublabels
            if (label.Children?.Count > 0)
            {
                var found = FindLabelById(label.Children, id);
                if (found != null) return found;
            }
        }
        return null;
    }

    // =========================================================================
    // ChangeLabelAsUserAsync
    // Altera rótulo usando SDK completo (ProtectionOnlyEngine = false) com tokens
    // do próprio usuário. Requer:
    //   - UserAadrmToken : https://aadrm.com/user_impersonation
    //   - UserPolicyToken: https://syncservice.o365syncservice.com/user_impersonation
    // Suporta arquivos com ou sem proteção RMS.
    // =========================================================================

    public async Task<byte[]> ChangeLabelAsUserAsync(
        ChangeLabelRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsureFileEngineInitializedAsync(cancellationToken);

        var userEmail = ExtractEmailFromJwt(request.UserAadrmToken!);
        _logger.LogInformation(
            "ChangeLabelAsUserAsync: {FileName} → {TargetLabel} | user={UserEmail}",
            request.FileName, request.TargetLabelImmutableId, MaskEmail(userEmail));

        var authDelegate = new MipSdkWorker.Services.Auth.UserTokenAuthDelegate(
            request.UserAadrmToken!,
            request.UserPolicyToken,
            _loggerFactory.CreateLogger<MipSdkWorker.Services.Auth.UserTokenAuthDelegate>());

        var engineId = BuildEngineKey("label-user", userEmail);

        // ---------------------------------------------------------------------
        // Checkmarx: Not Exploitable — Privacy Violation (CWE-359)
        // O authDelegate e a Identity são requisitos obrigatórios da API do MIP SDK.
        // O token trafega apenas para endpoints oficiais da Microsoft via TLS.
        // PII evitável já foi removido/mascarado (MaskEmail + BuildEngineKey).
        // ---------------------------------------------------------------------
        var engineSettings = new FileEngineSettings(
            engineId,
            authDelegate,
            "",
            "pt-BR")
        {
            Identity             = new Identity(userEmail ?? string.Empty),
            ProtectionOnlyEngine = false,
        };

        IFileEngine userEngine;
        try
        {
            userEngine = await _fileProfile!.AddEngineAsync(engineSettings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ChangeLabelAsUserAsync: falha ao criar engine para {FileName}", request.FileName);
            throw new InvalidOperationException(
                $"Não foi possível criar engine MIP para alterar rótulo: {ex.Message} " +
                "Verifique se userPolicyToken está presente e válido.", ex);
        }

        try
        {
            using var inputStream  = new MemoryStream(request.FileContent);
            using var outputStream = new MemoryStream();

            IFileHandler handler;
            try
            {
                handler = await userEngine.CreateFileHandlerAsync(
                    inputStream, request.FileName, isAuditDiscoveryEnabled: true);
            }
            catch (NoPermissionsException ex)
            {
                throw new UnauthorizedAccessException(
                    $"Usuário não tem direitos sobre '{request.FileName}'. " +
                    $"Owner={ex.Owner ?? "desconhecido"}.", ex);
            }

            using var _h = handler;

            if (handler.Protection != null)
            {
                var hasExport = handler.Protection!.AccessCheck(Rights.Export);
                var isOwner   = handler.Protection!.AccessCheck(Rights.Owner);
                _logger.LogInformation(
                    "{FileName}: proteção RMS detectada — Export={Export} Owner={Owner}",
                    request.FileName, hasExport, isOwner);

                if (!hasExport && !isOwner)
                    throw new UnauthorizedAccessException(
                        $"Usuário não tem direitos EXPORT/OWNER sobre '{request.FileName}'.");
            }

            var labels      = userEngine.SensitivityLabels;
            var targetLabel = FindLabelById(labels, request.TargetLabelImmutableId!);

            if (targetLabel == null)
            {
                var labelList = string.Join(", ", labels.Select(l => $"{l.Name}({l.Id})"));
                throw new InvalidOperationException(
                    $"Rótulo '{request.TargetLabelImmutableId}' não encontrado na política do usuário. " +
                    $"Labels disponíveis: {labelList}");
            }

            _logger.LogInformation(
                "ChangeLabelAsUserAsync: aplicando rótulo '{LabelName}' em {FileName}",
                targetLabel.Name, request.FileName);

            var labelOptions = new LabelingOptions
            {
                AssignmentMethod     = AssignmentMethod.Privileged,
                IsDowngradeJustified = true,
                JustificationMessage = "Rótulo alterado automaticamente pelo sistema CSA para compartilhamento externo.",
            };

            try
            {
                handler.SetLabel(targetLabel, labelOptions, new ProtectionSettings());
            }
            catch (JustificationRequiredException)
            {
                handler.SetLabel(targetLabel, new LabelingOptions
                {
                    AssignmentMethod     = AssignmentMethod.Privileged,
                    IsDowngradeJustified = true,
                    JustificationMessage = "Rótulo alterado automaticamente pelo sistema CSA.",
                }, new ProtectionSettings());
            }

            var committed = await handler.CommitAsync(outputStream);
            if (!committed)
                throw new InvalidOperationException($"CommitAsync retornou false para '{request.FileName}'.");

            var result = outputStream.ToArray();
            _logger.LogInformation(
                "ChangeLabelAsUserAsync concluído: {FileName} ({Orig}→{Final} bytes)",
                request.FileName, request.FileContent.Length, result.Length);
            return result;
        }
        finally
        {
            try { await _fileProfile!.DeleteEngineAsync(engineId); }
            catch { }
        }
    }

    // =========================================================================
    // RemoveLabelAndProtectionAsUserAsync
    // Cria um FileEngine temporário com o token do próprio usuário (owner).
    // Não depende de SuperUser — o usuário tem OWNER rights sobre seus arquivos.
    // =========================================================================

    public async Task<byte[]> RemoveLabelAndProtectionAsUserAsync(
        string fileName,
        byte[] fileContent,
        string userAadrmToken,
        CancellationToken cancellationToken = default)
    {
        // Garante que o MIP SDK global (MipContext + FileProfile) está inicializado.
        // O _fileProfile do singleton é reutilizável para criar engines adicionais.
        await EnsureFileEngineInitializedAsync(cancellationToken);

        _logger.LogInformation(
            "RemoveLabelAndProtectionAsUserAsync: criando engine temporário para {FileName}",
            fileName);

        var userAuthDelegate = new MipSdkWorker.Services.Auth.UserTokenAuthDelegate(
            userAadrmToken,
            policyToken: null,   // ProtectionOnlyEngine = true não precisa de policy token
            _loggerFactory.CreateLogger<MipSdkWorker.Services.Auth.UserTokenAuthDelegate>());

        // Extrai o email do usuário do token JWT para definir a Identity no engine.
        // O MIP SDK exige Identity (ou Cloud) para criar o FileEngine.
        var userEmail = ExtractEmailFromJwt(userAadrmToken);
        _logger.LogInformation(
            "RemoveLabelAndProtectionAsUserAsync: userEmail={UserEmail}",
            MaskEmail(userEmail));

        // Engine temporário com identidade de usuário.
        // ProtectionOnlyEngine = true: não requer InformationProtectionPolicy.Read.All
        var engineSettings = new FileEngineSettings(
            BuildEngineKey("user", userEmail),
            userAuthDelegate,
            "",
            "pt-BR")
        {
            Identity             = new Identity(userEmail ?? string.Empty),
            ProtectionOnlyEngine = true,
        };

        IFileEngine userEngine;
        try
        {
            userEngine = await _fileProfile!.AddEngineAsync(engineSettings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao criar engine de usuário para {FileName}", fileName);
            throw new InvalidOperationException(
                $"Não foi possível criar engine MIP com o token do usuário: {ex.Message} " +
                "Verifique se userPolicyToken está presente e válido.", ex);
        }

        try
        {
            using var inputStream  = new MemoryStream(fileContent);
            using var outputStream = new MemoryStream();

            IFileHandler handler;
            try
            {
                handler = await userEngine.CreateFileHandlerAsync(
                    inputStream, fileName, isAuditDiscoveryEnabled: true);
            }
            catch (NoPermissionsException ex)
            {
                throw new UnauthorizedAccessException(
                    $"Mesmo com token de usuário, o arquivo '{fileName}' não pode ser acessado. " +
                    $"Owner={ex.Owner ?? "desconhecido"}. " +
                    "Verifique se o token fornecido pertence ao owner do arquivo.", ex);
            }

            using var _h = handler;

            bool temProtecao;
            try { temProtecao = handler.Protection != null; }
            catch (NotSupportedException) { temProtecao = false; }

            if (!temProtecao)
            {
                _logger.LogInformation(
                    "{FileName}: sem proteção RMS no contexto do usuário. Usando strip OOXML.",
                    fileName);
                return StripMipLabelsFromOoxml(fileContent, fileName);
            }

            var hasExport = handler.Protection!.AccessCheck(Rights.Export);
            var isOwner   = handler.Protection!.AccessCheck(Rights.Owner);
            _logger.LogInformation(
                "{FileName}: usuário tem Export={Export} Owner={Owner}",
                fileName, hasExport, isOwner);

            if (!hasExport && !isOwner)
            {
                throw new UnauthorizedAccessException(
                    $"O usuário não tem direitos EXPORT ou OWNER sobre '{fileName}'. " +
                    "O arquivo foi criptografado por outro usuário ou a conta não tem licença MIP.");
            }

            handler.RemoveProtection();

            var committed = await handler.CommitAsync(outputStream);
            if (!committed)
                throw new InvalidOperationException($"CommitAsync retornou false para '{fileName}'.");

            var result = outputStream.ToArray();

            // Aplica rótulo "Público" ao arquivo processado, se configurado.
            // Usa manipulação OOXML direta — sem SDK, sem permissões Purview adicionais.
            if (!string.IsNullOrWhiteSpace(_mipOpts.PublicExternalLabelImmutableId))
            {
                result = ApplyOoxmlMipLabel(result, fileName,
                    _mipOpts.PublicExternalLabelImmutableId,
                    _entraId.TenantId);
            }

            _logger.LogInformation(
                "RemoveLabelAndProtectionAsUserAsync concluído: {FileName} ({Orig}→{Final} bytes)",
                fileName, fileContent.Length, result.Length);

            return result;
        }
        finally
        {
            // Remove o engine temporário do profile para liberar recursos
            try { await _fileProfile!.DeleteEngineAsync(engineSettings.EngineId); }
            catch { /* ignora — engine pode já ter sido removido */ }
        }
    }

    // =========================================================================
    // ApplyOoxmlMipLabel
    // Injeta rótulo MIP no arquivo OOXML pós-remoção de proteção RMS.
    // Fluxo: strip labels existentes → injeta XML do rótulo Público.
    // Não requer SDK nem permissões Purview — pura manipulação ZIP + XML.
    // =========================================================================

    private byte[] ApplyOoxmlMipLabel(byte[] content, string fileName, string labelId, string tenantId)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        if (ext != ".docx" && ext != ".xlsx" && ext != ".pptx")
        {
            _logger.LogInformation(
                "ApplyOoxmlMipLabel: {Ext} não é OOXML — sem injeção de rótulo para {FileName}.", ext, fileName);
            return content;
        }

        try
        {
            // 1. Remove labels existentes (ex: sobra do Confidencial após RemoveProtection)
            var stripped = StripMipLabelsFromOoxml(content, fileName);

            _logger.LogInformation(
                "ApplyOoxmlMipLabel: injetando rótulo {LabelId} em {FileName}", labelId, fileName);

            using var inputMs  = new MemoryStream(stripped);
            using var outputMs = new MemoryStream();

            var docRelsPath = _GetDocumentRelsPath(ext);

            // Primeira passagem: descobre próximo número de item disponível
            int itemNumber;
            using (var scanZip = new ZipArchive(inputMs, ZipArchiveMode.Read, leaveOpen: true))
                itemNumber = _GetNextCustomXmlItemNumber(scanZip);
            inputMs.Seek(0, SeekOrigin.Begin);

            // Segunda passagem: reconstrói ZIP injetando as partes MIP
            using (var inputZip  = new ZipArchive(inputMs,  ZipArchiveMode.Read,   leaveOpen: false))
            using (var outputZip = new ZipArchive(outputMs, ZipArchiveMode.Create, leaveOpen: true))
            {
                bool relsPatched = false;
                bool ctPatched   = false;

                foreach (var entry in inputZip.Entries)
                {
                    var newEntry = outputZip.CreateEntry(entry.FullName, CompressionLevel.Optimal);
                    using var inStream  = entry.Open();
                    using var outStream = newEntry.Open();

                    if (entry.FullName.Equals(docRelsPath, StringComparison.OrdinalIgnoreCase))
                    {
                        var xml = new StreamReader(inStream, System.Text.Encoding.UTF8).ReadToEnd();
                        _WriteUtf8(outStream, _PatchRelsWithCustomXml(xml, itemNumber));
                        relsPatched = true;
                    }
                    else if (entry.FullName.Equals("[Content_Types].xml", StringComparison.OrdinalIgnoreCase))
                    {
                        var xml = new StreamReader(inStream, System.Text.Encoding.UTF8).ReadToEnd();
                        _WriteUtf8(outStream, _PatchContentTypesWithCustomXml(xml, itemNumber));
                        ctPatched = true;
                    }
                    else
                    {
                        inStream.CopyTo(outStream);
                    }
                }

                // Se o rels do documento não existia, cria um mínimo
                if (!relsPatched)
                {
                    var relsEntry = outputZip.CreateEntry(docRelsPath, CompressionLevel.Optimal);
                    using var s = relsEntry.Open();
                    _WriteUtf8(s, _CreateMinimalDocRels(itemNumber));
                }

                _ = ctPatched; // [Content_Types].xml sempre existe em OOXML válido

                // Três novos arquivos: item + itemProps + rels do item
                _AddZipEntry(outputZip, $"customXml/item{itemNumber}.xml",
                    _BuildMipLabelItemXml(labelId, tenantId));
                _AddZipEntry(outputZip, $"customXml/itemProps{itemNumber}.xml",
                    _BuildMipLabelPropsXml(itemNumber));
                _AddZipEntry(outputZip, $"customXml/_rels/item{itemNumber}.xml.rels",
                    _BuildCustomXmlItemRels(itemNumber));
            }

            var result = outputMs.ToArray();
            _logger.LogInformation(
                "ApplyOoxmlMipLabel concluído: {FileName} ({In}→{Out} bytes)", fileName, content.Length, result.Length);
            return result;
        }
        catch (Exception ex)
        {
            // Degradação graciosa — não bloqueia o upload por falha na injeção do rótulo
            _logger.LogWarning(ex,
                "ApplyOoxmlMipLabel falhou para {FileName}. Retornando sem rótulo.", fileName);
            return content;
        }
    }

    // ── Helpers estáticos de OOXML ─────────────────────────────────────────

    private static string _GetDocumentRelsPath(string ext) =>
        ext switch
        {
            ".xlsx" or ".xls"  => "xl/_rels/workbook.xml.rels",
            ".pptx" or ".ppt"  => "ppt/_rels/presentation.xml.rels",
            _                  => "word/_rels/document.xml.rels",
        };

    private static int _GetNextCustomXmlItemNumber(ZipArchive zip)
    {
        int max = 0;
        foreach (var entry in zip.Entries)
        {
            if (!entry.FullName.StartsWith("customXml/item", StringComparison.OrdinalIgnoreCase)) continue;
            var name = Path.GetFileNameWithoutExtension(entry.Name);
            if (name.StartsWith("itemProps", StringComparison.OrdinalIgnoreCase)) continue;
            var m = System.Text.RegularExpressions.Regex.Match(name, @"\d+$");
            if (m.Success && int.TryParse(m.Value, out int n) && n > max) max = n;
        }
        return max + 1;
    }

    private static string _PatchRelsWithCustomXml(string xml, int n)
    {
        var newRel = $"  <Relationship Id=\"rIdMIPLabel{n}\" " +
                     $"Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml\" " +
                     $"Target=\"../customXml/item{n}.xml\"/>";
        var idx = xml.LastIndexOf("</Relationships>", StringComparison.OrdinalIgnoreCase);
        return idx < 0 ? xml : xml.Insert(idx, newRel + "\n");
    }

    private static string _PatchContentTypesWithCustomXml(string xml, int n)
    {
        var newTypes =
            $"  <Override PartName=\"/customXml/item{n}.xml\" ContentType=\"application/xml\"/>\n" +
            $"  <Override PartName=\"/customXml/itemProps{n}.xml\" " +
            $"ContentType=\"application/vnd.openxmlformats-officedocument.customXmlProperties+xml\"/>";
        var idx = xml.LastIndexOf("</Types>", StringComparison.OrdinalIgnoreCase);
        return idx < 0 ? xml : xml.Insert(idx, newTypes + "\n");
    }

    private static string _CreateMinimalDocRels(int n) =>
        $"<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n" +
        $"<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">\n" +
        $"  <Relationship Id=\"rIdMIPLabel{n}\" " +
        $"Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml\" " +
        $"Target=\"../customXml/item{n}.xml\"/>\n" +
        $"</Relationships>";

    private static string _BuildMipLabelItemXml(string labelId, string tenantId) =>
        "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n" +
        "<MIPLabel xmlns=\"http://schemas.microsoft.com/office/2017/09/15/MIPLabel\"\n" +
        $"          id=\"{labelId}\"\n" +
        "          enabled=\"true\"\n" +
        $"          setDate=\"{DateTime.UtcNow:yyyy-MM-ddTHH:mm:ssZ}\"\n" +
        "          method=\"Privileged\"\n" +
        "          contentBits=\"0\"\n" +
        $"          siteId=\"{tenantId}\"\n" +
        $"          actionId=\"{Guid.NewGuid():D}\"/>";

    private static string _BuildMipLabelPropsXml(int n) =>
        "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n" +
        $"<ds:datastoreItem ds:itemID=\"{{{Guid.NewGuid():D}}}\" " +
        "xmlns:ds=\"http://schemas.openxmlformats.org/officeDocument/2006/customXml\">\n" +
        "  <ds:schemaRefs>\n" +
        "    <ds:schemaRef ds:uri=\"http://schemas.microsoft.com/office/2017/09/15/MIPLabel\"/>\n" +
        "  </ds:schemaRefs>\n" +
        "</ds:datastoreItem>";

    private static string _BuildCustomXmlItemRels(int n) =>
        "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n" +
        "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">\n" +
        $"  <Relationship Id=\"rId1\" " +
        $"Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXmlProps\" " +
        $"Target=\"itemProps{n}.xml\"/>\n" +
        "</Relationships>";

    private static void _AddZipEntry(ZipArchive zip, string name, string content)
    {
        var entry = zip.CreateEntry(name, CompressionLevel.Optimal);
        using var s = entry.Open();
        _WriteUtf8(s, content);
    }

    private static void _WriteUtf8(Stream s, string content)
    {
        var b = System.Text.Encoding.UTF8.GetBytes(content);
        s.Write(b, 0, b.Length);
    }

    // =========================================================================
    // Fallback sem SDK para arquivos com label-only (sem criptografia RMS).
    // Manipula o ZIP OOXML diretamente — não requer nenhuma permissão Entra/Purview.
    // =========================================================================

    private byte[] StripMipLabelsFromOoxml(byte[] fileContent, string fileName)
    {
        _logger.LogInformation("Strip OOXML: iniciando para {FileName}", fileName);

        using var inputMs  = new MemoryStream(fileContent);
        using var outputMs = new MemoryStream();

        HashSet<string> mipParts;
        List<ZipArchiveEntry> entries;

        // Primeira passagem: descobre as parts MIP a remover
        using (var zip = new ZipArchive(inputMs, ZipArchiveMode.Read, leaveOpen: true))
        {
            mipParts = FindMipPartsInZip(zip);
            entries  = zip.Entries.ToList(); // guarda referência à listagem
        }

        if (mipParts.Count == 0)
        {
            _logger.LogInformation("{FileName}: nenhuma part MIP encontrada. Retornando original.", fileName);
            return fileContent;
        }

        _logger.LogInformation("{FileName}: removendo {Count} part(s) MIP: [{Parts}]",
            fileName, mipParts.Count, string.Join(", ", mipParts));

        // Segunda passagem: reconstrói o ZIP sem as parts MIP
        inputMs.Seek(0, SeekOrigin.Begin);
        using (var inputZip  = new ZipArchive(inputMs,  ZipArchiveMode.Read,   leaveOpen: false))
        using (var outputZip = new ZipArchive(outputMs, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach (var entry in inputZip.Entries)
            {
                if (mipParts.Contains(entry.FullName))
                {
                    _logger.LogDebug("Removendo part MIP: {Part}", entry.FullName);
                    continue;
                }

                var newEntry = outputZip.CreateEntry(entry.FullName, CompressionLevel.Optimal);
                using var inStream  = entry.Open();
                using var outStream = newEntry.Open();

                if (IsXmlReferenceFile(entry.FullName))
                {
                    // Reescreve [Content_Types].xml e *.rels removendo referências às parts MIP
                    using var reader = new StreamReader(inStream, System.Text.Encoding.UTF8);
                    var xml = reader.ReadToEnd();
                    var clean = PurgeMipReferencesFromXml(xml, mipParts);
                    var bytes = System.Text.Encoding.UTF8.GetBytes(clean);
                    outStream.Write(bytes, 0, bytes.Length);
                }
                else
                {
                    inStream.CopyTo(outStream);
                }
            }
        }

        var result = outputMs.ToArray();
        _logger.LogInformation("Strip OOXML concluído: {FileName} ({Original} → {Final} bytes)",
            fileName, fileContent.Length, result.Length);
        return result;
    }

    private static readonly string[] _mipUriMarkers =
    {
        "microsoft.com/office/2017/09/15/MIPLabel",
        "microsoft.com/office/2019/06/09/MIPLabel",
        "microsoft.com/office/2018/08/MIPLabelMetadata",
        "MSIP_Label",
        "MIPLabel",
    };

    private static HashSet<string> FindMipPartsInZip(ZipArchive zip)
    {
        var mipParts = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var entry in zip.Entries)
        {
            // Apenas parts dentro de customXml/
            if (!entry.FullName.Contains("customXml/", StringComparison.OrdinalIgnoreCase))
                continue;

            string content;
            using (var s = entry.Open())
            using (var r = new StreamReader(s))
                content = r.ReadToEnd();

            if (!_mipUriMarkers.Any(m => content.Contains(m, StringComparison.OrdinalIgnoreCase)))
                continue;

            mipParts.Add(entry.FullName);

            // Adiciona o par complementar (item ↔ itemProps)
            var dir  = Path.GetDirectoryName(entry.FullName)?.Replace('\\', '/') ?? "";
            var file = Path.GetFileName(entry.FullName);
            var num  = System.Text.RegularExpressions.Regex.Match(file, @"\d+").Value;

            if (!string.IsNullOrEmpty(num))
            {
                mipParts.Add($"{dir}/item{num}.xml");
                mipParts.Add($"{dir}/itemProps{num}.xml");
            }
        }

        return mipParts;
    }

    private static bool IsXmlReferenceFile(string fullName) =>
        fullName.Equals("[Content_Types].xml", StringComparison.OrdinalIgnoreCase) ||
        fullName.EndsWith(".rels", StringComparison.OrdinalIgnoreCase);

    private static string PurgeMipReferencesFromXml(string xml, HashSet<string> mipParts)
    {
        try
        {
            var doc = XDocument.Parse(xml);

            var toRemove = doc.Descendants()
                .Where(el =>
                {
                    // [Content_Types].xml: PartName="/word/customXml/item1.xml"
                    var partName = (string?)el.Attribute("PartName");
                    if (partName != null)
                    {
                        var normalized = partName.TrimStart('/');
                        if (mipParts.Contains(normalized)) return true;
                    }

                    // *.rels: Target="../customXml/item1.xml"
                    var target = (string?)el.Attribute("Target");
                    if (target != null)
                    {
                        var fileName = Path.GetFileName(target);
                        if (mipParts.Any(p =>
                            Path.GetFileName(p).Equals(fileName, StringComparison.OrdinalIgnoreCase)))
                            return true;
                    }

                    return false;
                })
                .ToList();

            foreach (var el in toRemove)
                el.Remove();

            return doc.ToString(SaveOptions.OmitDuplicateNamespaces);
        }
        catch
        {
            // Falha no parse XML — retorna original sem modificação
            return xml;
        }
    }

    // =========================================================================
    // MaskEmail
    // Anonimiza e-mail para uso em logs, evitando exposição de PII (CWE-359).
    // Mantém o domínio para rastreabilidade operacional sem expor o usuário.
    // Exemplo: "joao.silva@petrobras.com.br" → "j***@petrobras.com.br"
    // =========================================================================

    private static string MaskEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email)) return "?";

        var atIndex = email.IndexOf('@');
        if (atIndex <= 0) return "***";

        // Preserva apenas o primeiro caractere do local-part + domínio
        var local  = email[..atIndex];
        var domain = email[atIndex..];
        var masked = local.Length == 1
            ? $"{local[0]}***{domain}"
            : $"{local[0]}***{domain}";

        return masked;
    }

    // =========================================================================
    // BuildEngineKey
    // Gera um identificador estável e NÃO reversível (SHA-256) a partir do
    // e-mail do usuário, para ser usado como chave de cache do FileEngine.
    // Evita que dados pessoais (PII) sejam embutidos em texto puro no
    // identificador do engine (Privacy Violation / CWE-359). Usuários iguais
    // continuam mapeando para o mesmo engine, sem expor o e-mail.
    // =========================================================================

    private static string BuildEngineKey(string prefix, string? userEmail)
    {
        if (string.IsNullOrWhiteSpace(userEmail))
            return $"{prefix}-{Guid.NewGuid():N}";

        var bytes  = System.Text.Encoding.UTF8.GetBytes(userEmail.Trim().ToLowerInvariant());
        var hash   = System.Security.Cryptography.SHA256.HashData(bytes);
        var hex    = Convert.ToHexString(hash).ToLowerInvariant();
        return $"{prefix}-{hex}";
    }

    // =========================================================================
    // ExtractEmailFromJwt
    // Decodifica o payload do JWT (sem verificação de assinatura) para obter
    // o email/UPN do usuário — necessário para definir Identity no FileEngine.
    // =========================================================================

    private static string? ExtractEmailFromJwt(string token)
    {
        try
        {
            var parts = token.Split('.');
            if (parts.Length < 2) return null;

            // Base64Url → Base64 padrão
            var payload = parts[1]
                .Replace('-', '+')
                .Replace('_', '/');
            var padded = payload.PadRight(
                payload.Length + (4 - payload.Length % 4) % 4, '=');

            var bytes = Convert.FromBase64String(padded);
            var json  = System.Text.Encoding.UTF8.GetString(bytes);

            using var doc  = System.Text.Json.JsonDocument.Parse(json);
            var root = doc.RootElement;

            // Tenta diferentes nomes de claim usados pelo Azure AD / AADRM
            foreach (var claim in new[] { "upn", "preferred_username", "unique_name", "email" })
            {
                if (root.TryGetProperty(claim, out var val))
                {
                    var email = val.GetString();
                    if (!string.IsNullOrWhiteSpace(email))
                        return email;
                }
            }
            return null;
        }
        catch
        {
            return null;
        }
    }

    // =========================================================================
    // Dispose
    // =========================================================================

    public void Dispose()
    {
        (_fileEngine   as IDisposable)?.Dispose();
        (_policyEngine as IDisposable)?.Dispose();
        (_fileProfile  as IDisposable)?.Dispose();

        _mipContext?.ShutDown();
        _mipContext = null;

        _initLock.Dispose();
        _policyInitLock.Dispose();
    }
}

file sealed class ConsentDelegate : IConsentDelegate
{
    public Consent GetUserConsent(string url) => Consent.Accept;
}

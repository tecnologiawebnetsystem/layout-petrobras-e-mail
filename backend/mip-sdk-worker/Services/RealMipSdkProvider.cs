using Microsoft.InformationProtection;
using Microsoft.InformationProtection.File;
using Microsoft.InformationProtection.Protection;
using Microsoft.InformationProtection.Exceptions;
using Microsoft.Extensions.Options;
using MipSdkWorker.Contracts;
using MipSdkWorker.Options;
using MipSdkWorker.Services.Auth;

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
    private IFileEngine? _fileEngine;
    private readonly SemaphoreSlim _initLock = new(1, 1);

    private static bool _mipInitialized;
    private static readonly object _mipInitLock = new();
    private bool _initialized;

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
                // Erro determinístico — não adianta retentar
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
    // EnsureInitializedAsync
    // =========================================================================

    private async Task EnsureInitializedAsync(CancellationToken ct)
    {
        if (_initialized) return;

        await _initLock.WaitAsync(ct);
        try
        {
            if (_initialized) return;

            _logger.LogInformation(
                "Inicializando MIP SDK (TenantId={TenantId} ClientId={ClientId})",
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

            // ── FileEngine ─────────────────────────────────────────────────────
            // - ProtectionOnlyEngine = true → NÃO carrega PolicyProfile
            //   Não requer UnifiedPolicy.Tenant.Read / Sync Service
            //   Requer apenas: Content.DelegatedWriter + Content.SuperUser
            var engineSettings = new FileEngineSettings(
                _entraId.ClientId,  // engine id
                authDelegate,
                "",                 // client data
                "pt-BR")            // locale (obrigatório)
            {
                Identity = new Identity(_entraId.ClientId),
                ProtectionOnlyEngine = true,
            };

            _fileEngine = await RetryAsync(() =>
                _fileProfile.AddEngineAsync(engineSettings));

            _initialized = true;
            _logger.LogInformation("MIP SDK inicializado com sucesso (ProtectionOnly).");
        }
        catch (AccessDeniedException ex)
        {
            _logger.LogError(ex,
                "Acesso negado ao inicializar MIP SDK. Verifique: " +
                "1) Content.SuperUser no App Registration (admin consent) " +
                "2) Enable-AipServiceSuperUser no tenant " +
                "3) Add-AipServiceSuperUser -ServicePrincipalId {ClientId}",
                _entraId.ClientId);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao inicializar MIP SDK.");
            throw;
        }
        finally
        {
            _initLock.Release();
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
        await EnsureInitializedAsync(cancellationToken);

        _logger.LogInformation("Processando: {FileName} ({Size} bytes)",
            fileName, fileContent.Length);

        using var inputStream = new MemoryStream(fileContent);
        using var outputStream = new MemoryStream();

        // Cria o FileHandler a partir do stream
        using var handler = await RetryAsync(() =>
            _fileEngine!.CreateFileHandlerAsync(
                inputStream,
                fileName,
                isAuditDiscoveryEnabled: true));

        // Verifica se há proteção ou label
        var temLabel = handler.Label != null;
        var temProtecao = handler.Protection != null;

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
    // =========================================================================

    public Task<byte[]> ChangeLabelAsync(
        ChangeLabelRequest request,
        CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException(
            "ChangeLabelAsync requer ProtectionOnlyEngine = false " +
            "e a permissão UnifiedPolicy.Tenant.Read no App Registration.");
    }

    // =========================================================================
    // Dispose
    // =========================================================================

    public void Dispose()
    {
        (_fileEngine as IDisposable)?.Dispose();
        (_fileProfile as IDisposable)?.Dispose();

        _mipContext?.ShutDown();
        _mipContext = null;

        _initLock.Dispose();
    }
}

file sealed class ConsentDelegate : IConsentDelegate
{
    public Consent GetUserConsent(string url) => Consent.Accept;
}

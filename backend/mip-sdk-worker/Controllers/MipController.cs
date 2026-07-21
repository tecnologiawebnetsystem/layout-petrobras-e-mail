using MipSdkWorker.Contracts;
using MipSdkWorker.Options;
using MipSdkWorker.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace MipSdkWorker.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class MipController : ControllerBase
{
    private readonly IMipProcessingService _mipService;
    private readonly ILogger<MipController> _logger;
    private readonly MipWorkerOptions _mipWorkerOptions;

    /// <summary>
    /// Mapeamento extensão → MIME types aceitos.
    /// Usado para validar Content-Type do multipart em todos os endpoints.
    /// O WAF/ALB Petrobras rejeita requests cujo Content-Type não corresponde à extensão.
    /// </summary>
    private static readonly Dictionary<string, string[]> AllowedFileTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        [".docx"] = ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        [".doc"]  = ["application/msword"],
        [".xlsx"] = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
        [".xls"]  = ["application/vnd.ms-excel"],
        [".pptx"] = ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
        [".ppt"]  = ["application/vnd.ms-powerpoint"],
        [".pdf"]  = ["application/pdf"],
        [".txt"]  = ["text/plain"],
    };

    public MipController(
        IMipProcessingService mipService,
        ILogger<MipController> logger,
        IOptions<MipWorkerOptions> mipWorkerOptions)
    {
        _mipService = mipService;
        _logger = logger;
        _mipWorkerOptions = mipWorkerOptions.Value;
    }

    /// <summary>
    /// Removes MIP labels and protection from an uploaded file.
    /// </summary>
    /// <remarks>
    /// Accepts multipart/form-data with a file upload.
    /// Returns processed file as binary or JSON with base64-encoded content.
    /// Requires Authorization header: Bearer &lt;token&gt;
    /// </remarks>
    [HttpPost("remove-label")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> RemoveLabel(IFormFile file, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            _logger.LogWarning("Remove-label request with no file");
            return BadRequest(new { error = "No file provided" });
        }

        var maxSize = _mipWorkerOptions.MaxFileSizeBytes;
        if (file.Length > maxSize)
        {
            _logger.LogWarning("File size {FileSize} exceeds limit {MaxSize}", file.Length, maxSize);
            return BadRequest(new { error = $"File size exceeds maximum of {maxSize} bytes" });
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedFileTypes.TryGetValue(extension, out var allowedMimes) ||
            !allowedMimes.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase))
        {
            _logger.LogWarning(
                "Remove-label: Content-Type '{ContentType}' inválido para extensão '{Extension}'",
                file.ContentType, extension);
            return BadRequest(new { error = "Content-Type does not match the file extension" });
        }

        try
        {
            // Read file into memory
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            var fileBytes = ms.ToArray();

            _logger.LogInformation("Processing file: {FileName} ({FileSize} bytes)", file.FileName, file.Length);

            // Process with MIP service
            var processedBytes = await _mipService.RemoveLabelAndProtectionAsync(file.FileName, fileBytes, cancellationToken);

            _logger.LogInformation("File processed successfully: {FileName}", file.FileName);

            // Return as binary file
            return File(processedBytes, "application/octet-stream", file.FileName);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Arquivo criptografado sem permissão para processar: {FileName}", file.FileName);
            return UnprocessableEntity(new
            {
                error = "MIP_ENCRYPTED_NO_RIGHTS",
                detail = ex.Message,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing file: {FileName}", file.FileName);
            return StatusCode(500, new { error = "Error processing file", detail = ex.Message });
        }
    }

    [HttpPost("change-label")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ChangeLabel(
        IFormFile file,
        [FromForm] string? targetLabelImmutableId,
        [FromForm] string? sourceLabelImmutableId,
        CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file provided" });

        var maxSize = _mipWorkerOptions.MaxFileSizeBytes;
        if (file.Length > maxSize)
            return BadRequest(new { error = $"File size exceeds maximum of {maxSize} bytes" });

        if (string.IsNullOrWhiteSpace(targetLabelImmutableId))
            return BadRequest(new { error = "targetLabelImmutableId is required" });

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedFileTypes.TryGetValue(extension, out var allowedMimes) ||
            !allowedMimes.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase))
        {
            return BadRequest(new { error = "Content-Type does not match the file extension" });
        }

        var safeFileName = $"{Guid.NewGuid()}{extension}";
        var allowedMimeTypes = new[] 
            { 
                "application/pdf", 
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
                "application/vnd.openxmlformats-officedocument.presentationml.presentation" 
            };

        
        
        if (!allowedMimeTypes.Contains(file.ContentType))
            return BadRequest(new { error = "Invalid content type" });


        using var ms = new MemoryStream();
        await file.CopyToAsync(ms, cancellationToken);
        var fileBytes = ms.ToArray();

        var processedBytes = await _mipService.ChangeLabelAsync(
            new ChangeLabelRequest
            {
                FileName = safeFileName,
                FileContent = fileBytes,
                SourceLabelImmutableId = sourceLabelImmutableId,
                TargetLabelImmutableId = targetLabelImmutableId,
            },
            cancellationToken);

        return File(processedBytes, "application/octet-stream", safeFileName);
    }

    [HttpPost("change-label/public-external")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ChangeLabelToPublicExternal(
        IFormFile file,
        [FromForm] string? userAadrmToken,
        [FromForm] string? userPolicyToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_mipWorkerOptions.PublicExternalLabelImmutableId))
            return StatusCode(500, new { error = "PublicExternalLabelImmutableId is not configured" });

        // Com tokens de usuário: usa o SDK completo (label change correto via Purview)
        if (!string.IsNullOrWhiteSpace(userAadrmToken))
        {
            return await ChangeLabelAsUser(
                file,
                userAadrmToken,
                userPolicyToken,
                _mipWorkerOptions.PublicExternalLabelImmutableId,
                cancellationToken);
        }

        // Sem tokens: delega para change-label (SP auth, NotImplemented sem permissão Purview)
        return await ChangeLabel(
            file,
            _mipWorkerOptions.PublicExternalLabelImmutableId,
            _mipWorkerOptions.ConfidentialLabelImmutableId,
            cancellationToken);
    }

    /// <summary>
    /// Altera o rótulo de um arquivo usando os tokens do próprio usuário.
    /// Usa ProtectionOnlyEngine = false — suporta arquivos com ou sem proteção RMS.
    /// Tokens necessários (adquiridos via MSAL popup com AIP Viewer app c00e9d32):
    ///   - userAadrmToken : https://aadrm.com/user_impersonation
    ///   - userPolicyToken: https://syncservice.o365syncservice.com/user_impersonation
    /// </summary>
    [HttpPost("change-label-as-user")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ChangeLabelAsUser(
        IFormFile file,
        [FromForm] string userAadrmToken,
        [FromForm] string? userPolicyToken,
        [FromForm] string? targetLabelImmutableId,
        CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file provided" });

        if (string.IsNullOrWhiteSpace(userAadrmToken))
            return BadRequest(new { error = "userAadrmToken is required" });

        var effectiveTarget = !string.IsNullOrWhiteSpace(targetLabelImmutableId)
            ? targetLabelImmutableId
            : _mipWorkerOptions.PublicExternalLabelImmutableId;

        if (string.IsNullOrWhiteSpace(effectiveTarget))
            return BadRequest(new { error = "targetLabelImmutableId is required (or configure PublicExternalLabelImmutableId)" });

        var maxSize = _mipWorkerOptions.MaxFileSizeBytes;
        if (file.Length > maxSize)
            return BadRequest(new { error = $"File size exceeds maximum of {maxSize} bytes" });

        try
        {
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms, cancellationToken);
            var fileBytes = ms.ToArray();

            _logger.LogInformation(
                "change-label-as-user: {FileName} ({Size} bytes) → {Label}",
                file.FileName, file.Length, effectiveTarget);

            var processedBytes = await _mipService.ChangeLabelAsUserAsync(
                new MipSdkWorker.Contracts.ChangeLabelRequest
                {
                    FileName               = file.FileName,
                    FileContent            = fileBytes,
                    TargetLabelImmutableId = effectiveTarget,
                    UserAadrmToken         = userAadrmToken,
                    UserPolicyToken        = userPolicyToken,
                },
                cancellationToken);

            _logger.LogInformation(
                "change-label-as-user sucesso: {FileName} ({In}→{Out} bytes)",
                file.FileName, fileBytes.Length, processedBytes.Length);

            return File(processedBytes, "application/octet-stream", file.FileName);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "change-label-as-user: sem permissão: {FileName}", file.FileName);
            return UnprocessableEntity(new { error = "MIP_USER_NO_RIGHTS", detail = ex.Message });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("não encontrado"))
        {
            _logger.LogWarning(ex, "change-label-as-user: label não encontrado: {FileName}", file.FileName);
            return UnprocessableEntity(new { error = "MIP_LABEL_NOT_FOUND", detail = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "change-label-as-user: erro interno: {FileName}", file.FileName);
            return StatusCode(500, new { error = ex.GetType().Name, detail = ex.Message });
        }
    }

    /// <summary>
    /// Remove proteção RMS usando o token do próprio usuário (owner do arquivo).
    /// O token AADRM deve ser adquirido pelo frontend via MSAL popup com o app
    /// Azure Information Protection Viewer (c00e9d32-3c8d-4a7d-832b-029040e7db99).
    /// Após remover a proteção, aplica o rótulo Público via OOXML direto.
    /// </summary>
    [HttpPost("remove-label-as-user")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> RemoveLabelAsUser(
        IFormFile file,
        [FromForm] string userAadrmToken,
        CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file provided" });

        if (string.IsNullOrWhiteSpace(userAadrmToken))
            return BadRequest(new { error = "userAadrmToken is required" });

        var maxSize = _mipWorkerOptions.MaxFileSizeBytes;
        if (file.Length > maxSize)
            return BadRequest(new { error = $"File size exceeds maximum of {maxSize} bytes" });

        try
        {
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms, cancellationToken);
            var fileBytes = ms.ToArray();

            _logger.LogInformation(
                "remove-label-as-user: {FileName} ({Size} bytes)",
                file.FileName, file.Length);

            var processedBytes = await _mipService.RemoveLabelAndProtectionAsUserAsync(
                file.FileName, fileBytes, userAadrmToken, cancellationToken);

            _logger.LogInformation(
                "remove-label-as-user sucesso: {FileName} ({In}→{Out} bytes)",
                file.FileName, fileBytes.Length, processedBytes.Length);

            return File(processedBytes, "application/octet-stream", file.FileName);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "remove-label-as-user: sem permissão de usuário: {FileName}", file.FileName);
            return UnprocessableEntity(new
            {
                error  = "MIP_USER_NO_RIGHTS",
                detail = ex.Message,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "remove-label-as-user: erro interno: {FileName}", file.FileName);
            return StatusCode(500, new { error = ex.GetType().Name, detail = ex.Message });
        }
    }
}

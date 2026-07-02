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
        var allowedExtensions = new[] { ".pdf", ".docx", ".xlsx", ".pptx" };
        
        if (!allowedExtensions.Contains(extension))
            return BadRequest(new { error = "File type not allowed" });

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
    public async Task<IActionResult> ChangeLabelToPublicExternal(IFormFile file, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_mipWorkerOptions.PublicExternalLabelImmutableId))
        {
            return StatusCode(500, new { error = "PublicExternalLabelImmutableId is not configured" });
        }

        return await ChangeLabel(
            file,
            _mipWorkerOptions.PublicExternalLabelImmutableId,
            _mipWorkerOptions.ConfidentialLabelImmutableId,
            cancellationToken);
    }
}

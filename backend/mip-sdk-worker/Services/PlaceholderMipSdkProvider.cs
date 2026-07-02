using MipSdkWorker.Contracts;
using MipSdkWorker.Options;
using Microsoft.Extensions.Options;

namespace MipSdkWorker.Services;

public sealed class PlaceholderMipSdkProvider : IMipSdkProvider
{
    private readonly ILogger<PlaceholderMipSdkProvider> _logger;
    private readonly MipWorkerOptions _mipWorkerOptions;

    public PlaceholderMipSdkProvider(
        ILogger<PlaceholderMipSdkProvider> logger,
        IOptions<MipWorkerOptions> mipWorkerOptions)
    {
        _logger = logger;
        _mipWorkerOptions = mipWorkerOptions.Value;
    }

    public Task<byte[]> RemoveLabelAndProtectionAsync(string fileName, byte[] fileContent, CancellationToken cancellationToken = default)
    {
        if (!_mipWorkerOptions.PlaceholderModeEnabled)
        {
            throw new InvalidOperationException("MIP SDK provider real ainda nao foi configurado.");
        }

        _logger.LogWarning(
            "Executando PlaceholderMipSdkProvider em remove-label para {FileName}. O SDK real ainda nao foi plugado.",
            fileName);

        return Task.FromResult(fileContent);
    }

    public Task<byte[]> ChangeLabelAsync(ChangeLabelRequest request, CancellationToken cancellationToken = default)
    {
        if (!_mipWorkerOptions.PlaceholderModeEnabled)
        {
            throw new InvalidOperationException("MIP SDK provider real ainda nao foi configurado.");
        }

        _logger.LogWarning(
            "Executando PlaceholderMipSdkProvider em change-label para {FileName}. Source={SourceLabel} Target={TargetLabel}",
            request.FileName,
            request.SourceLabelImmutableId,
            request.TargetLabelImmutableId);

        return Task.FromResult(request.FileContent);
    }
}

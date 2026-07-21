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
            throw new InvalidOperationException("MIP SDK provider real ainda nao foi configurado.");

        _logger.LogWarning(
            "Executando PlaceholderMipSdkProvider em change-label para {FileName}. Source={SourceLabel} Target={TargetLabel}",
            request.FileName, request.SourceLabelImmutableId, request.TargetLabelImmutableId);

        return Task.FromResult(request.FileContent);
    }

    public Task<byte[]> RemoveLabelAndProtectionAsUserAsync(
        string fileName, byte[] fileContent, string userAadrmToken, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning(
            "PlaceholderMipSdkProvider: test-user-context nao disponivel no modo placeholder para {FileName}.",
            fileName);
        return Task.FromResult(fileContent);
    }

    public Task<byte[]> ChangeLabelAsUserAsync(
        ChangeLabelRequest request, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning(
            "PlaceholderMipSdkProvider: change-label-as-user nao disponivel no modo placeholder para {FileName}.",
            request.FileName);
        return Task.FromResult(request.FileContent);
    }
}

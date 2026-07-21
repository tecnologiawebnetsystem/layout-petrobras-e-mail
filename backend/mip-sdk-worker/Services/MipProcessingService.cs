using MipSdkWorker.Contracts;
using MipSdkWorker.Options;
using Microsoft.Extensions.Options;

namespace MipSdkWorker.Services;

public class MipProcessingService : IMipProcessingService
{
    private readonly ILogger<MipProcessingService> _logger;
    private readonly IMipSdkProvider _mipSdkProvider;
    private readonly EntraIdOptions _entraIdOptions;
    private readonly MipWorkerOptions _mipWorkerOptions;

    public MipProcessingService(
        ILogger<MipProcessingService> logger,
        IMipSdkProvider mipSdkProvider,
        IOptions<EntraIdOptions> entraIdOptions,
        IOptions<MipWorkerOptions> mipWorkerOptions)
    {
        _logger = logger;
        _mipSdkProvider = mipSdkProvider;
        _entraIdOptions = entraIdOptions.Value;
        _mipWorkerOptions = mipWorkerOptions.Value;
    }

    public async Task<byte[]> RemoveLabelAndProtectionAsync(string fileName, byte[] fileContent, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting MIP processing for file: {FileName} (size: {Size} bytes)", fileName, fileContent.Length);

        ValidateSdkConfiguration();

        try
        {
            var processedBytes = await _mipSdkProvider.RemoveLabelAndProtectionAsync(fileName, fileContent, cancellationToken);
            _logger.LogInformation("MIP processing completed for file: {FileName}", fileName);
            return processedBytes;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing file {FileName}", fileName);
            throw;
        }
    }

    public async Task<byte[]> ChangeLabelAsync(ChangeLabelRequest request, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "Starting label change for file: {FileName}. Source={SourceLabel} Target={TargetLabel}",
            request.FileName,
            request.SourceLabelImmutableId,
            request.TargetLabelImmutableId);

        ValidateSdkConfiguration();

        if (string.IsNullOrWhiteSpace(request.TargetLabelImmutableId))
        {
            throw new InvalidOperationException("TargetLabelImmutableId deve ser informado para alteracao de rotulo.");
        }

        var processedBytes = await _mipSdkProvider.ChangeLabelAsync(request, cancellationToken);

        _logger.LogInformation("Label change completed for file: {FileName}", request.FileName);
        return processedBytes;
    }

    public async Task<byte[]> RemoveLabelAndProtectionAsUserAsync(
        string fileName,
        byte[] fileContent,
        string userAadrmToken,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("RemoveLabelAndProtectionAsUserAsync: {FileName}", fileName);
        ValidateSdkConfiguration();
        return await _mipSdkProvider.RemoveLabelAndProtectionAsUserAsync(
            fileName, fileContent, userAadrmToken, cancellationToken);
    }

    public async Task<byte[]> ChangeLabelAsUserAsync(
        ChangeLabelRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "ChangeLabelAsUserAsync: {FileName} → {TargetLabel}",
            request.FileName, request.TargetLabelImmutableId);
        ValidateSdkConfiguration();
        if (string.IsNullOrWhiteSpace(request.TargetLabelImmutableId))
            throw new InvalidOperationException("TargetLabelImmutableId é obrigatório.");
        if (string.IsNullOrWhiteSpace(request.UserAadrmToken))
            throw new InvalidOperationException("UserAadrmToken é obrigatório para chang-label-as-user.");
        return await _mipSdkProvider.ChangeLabelAsUserAsync(request, cancellationToken);
    }

    private void ValidateSdkConfiguration()
    {
        if (string.IsNullOrWhiteSpace(_entraIdOptions.TenantId) ||
            string.IsNullOrWhiteSpace(_entraIdOptions.ClientId) ||
            string.IsNullOrWhiteSpace(_entraIdOptions.ClientSecret))
        {
            throw new InvalidOperationException("Configuracao EntraId incompleta para o worker MIP SDK.");
        }

        if (_mipWorkerOptions.ProcessingTimeoutSeconds <= 0)
        {
            throw new InvalidOperationException("MipWorker:ProcessingTimeoutSeconds deve ser maior que zero.");
        }
    }
}

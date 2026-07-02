using MipSdkWorker.Contracts;

namespace MipSdkWorker.Services;

public interface IMipSdkProvider
{
    Task<byte[]> RemoveLabelAndProtectionAsync(string fileName, byte[] fileContent, CancellationToken cancellationToken = default);
    Task<byte[]> ChangeLabelAsync(ChangeLabelRequest request, CancellationToken cancellationToken = default);
}

using MipSdkWorker.Contracts;

namespace MipSdkWorker.Services;

public interface IMipProcessingService
{
    /// <summary>
    /// Removes MIP labels and protection from a file.
    /// </summary>
    /// <param name="fileName">Original file name (e.g., "document.docx")</param>
    /// <param name="fileContent">Raw file bytes</param>
    /// <returns>Processed file bytes with labels removed</returns>
    Task<byte[]> RemoveLabelAndProtectionAsync(string fileName, byte[] fileContent, CancellationToken cancellationToken = default);

    /// <summary>
    /// Changes a file label using MIP SDK.
    /// </summary>
    Task<byte[]> ChangeLabelAsync(ChangeLabelRequest request, CancellationToken cancellationToken = default);
}

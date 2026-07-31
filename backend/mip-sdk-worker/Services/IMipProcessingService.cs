using MipSdkWorker.Contracts;

namespace MipSdkWorker.Services;

public interface IMipProcessingService
{
    /// <summary>Remove labels e proteção via SP. Label-only usa OOXML strip.</summary>
    Task<byte[]> RemoveLabelAndProtectionAsync(string fileName, byte[] fileContent, CancellationToken cancellationToken = default);

    /// <summary>
    /// Altera rótulo via SP auth (PolicyEngine, ProtectionOnlyEngine=false).
    /// Aplica-se SOMENTE a arquivos com proteção RMS (Confidencial com criptografia).
    /// Arquivos sem proteção RMS (Interno, Público) são devolvidos sem modificação.
    /// Requer: UnifiedPolicy.Tenant.Read + Content.DelegatedWriter + Content.SuperUser.
    /// </summary>
    Task<byte[]> ChangeLabelAsync(ChangeLabelRequest request, CancellationToken cancellationToken = default);

    /// <summary>Remove proteção RMS via token do usuário. Aplica Público Externo via OOXML.</summary>
    Task<byte[]> RemoveLabelAndProtectionAsUserAsync(string fileName, byte[] fileContent, string userAadrmToken, CancellationToken cancellationToken = default);

    /// <summary>
    /// Altera rótulo via SDK completo usando tokens do usuário (ProtectionOnlyEngine = false).
    /// Remove proteção RMS se presente e aplica o novo rótulo.
    /// </summary>
    Task<byte[]> ChangeLabelAsUserAsync(ChangeLabelRequest request, CancellationToken cancellationToken = default);
}

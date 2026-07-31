using MipSdkWorker.Contracts;

namespace MipSdkWorker.Services;

public interface IMipSdkProvider
{
    /// <summary>Remove label e proteção via SP (service auth). Label-only via OOXML strip.</summary>
    Task<byte[]> RemoveLabelAndProtectionAsync(string fileName, byte[] fileContent, CancellationToken cancellationToken = default);

    /// <summary>
    /// Remove proteção RMS via token do usuário (owner). Aplica label Público Externo via OOXML.
    /// Requer: userAadrmToken. ProtectionOnlyEngine = true.
    /// </summary>
    Task<byte[]> RemoveLabelAndProtectionAsUserAsync(string fileName, byte[] fileContent, string userAadrmToken, CancellationToken cancellationToken = default);

    /// <summary>
    /// Altera rótulo do arquivo usando tokens do usuário (SDK completo).
    /// Requer: userAadrmToken + userPolicyToken. ProtectionOnlyEngine = false.
    /// Suporta: remover proteção RMS + aplicar novo rótulo (ex: Público Externo).
    /// </summary>
    Task<byte[]> ChangeLabelAsUserAsync(ChangeLabelRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Altera rótulo via SP auth usando PolicyEngine (ProtectionOnlyEngine = false).
    /// Aplica-se SOMENTE a arquivos com proteção RMS (Confidencial com criptografia).
    /// Arquivos sem proteção RMS (Interno, Público) são devolvidos sem modificação.
    /// Requer: UnifiedPolicy.Tenant.Read + Content.DelegatedWriter + Content.SuperUser.
    /// Label Policy deve estar publicada para a conta de serviço no portal Purview.
    /// </summary>
    Task<byte[]> ChangeLabelAsync(ChangeLabelRequest request, CancellationToken cancellationToken = default);
}

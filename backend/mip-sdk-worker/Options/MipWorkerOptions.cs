// MipWorkerOptions.cs
using System.ComponentModel.DataAnnotations;

namespace MipSdkWorker.Options;

public sealed class MipWorkerOptions
{
    public const string SectionName = "MipWorker";

    public string? ServiceApiToken { get; init; }

    [Range(1, 600, ErrorMessage = "ProcessingTimeoutSeconds deve ser entre 1 e 600")]
    public int ProcessingTimeoutSeconds { get; init; } = 120;

    [Range(1, 104_857_600, ErrorMessage = "MaxFileSizeBytes deve ser entre 1 e 100MB")]
    public long MaxFileSizeBytes { get; init; } = 52_428_800;

    // ← padrão agora é FALSE — placeholder só ativa explicitamente
    public bool PlaceholderModeEnabled { get; init; } = false;

    // Opcional — GUID do rótulo Confidencial. Usado como SourceLabelImmutableId
    // no endpoint change-label/public-external. Pode ser deixado vazio; o GUID
    // real deve ser obtido via portal Purview → Information Protection → Labels.
    public string? ConfidentialLabelImmutableId { get; init; }

    [Required(ErrorMessage = "MipWorker:PublicExternalLabelImmutableId é obrigatório")]
    public string PublicExternalLabelImmutableId { get; init; } = string.Empty;
}

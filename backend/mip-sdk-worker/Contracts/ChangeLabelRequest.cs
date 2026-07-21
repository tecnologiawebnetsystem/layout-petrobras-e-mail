namespace MipSdkWorker.Contracts;

public sealed class ChangeLabelRequest
{
    public required string FileName { get; init; }
    public required byte[] FileContent { get; init; }
    public string? SourceLabelImmutableId { get; init; }
    public string? TargetLabelImmutableId { get; init; }

    // Tokens de usuário para operações autenticadas (change-label-as-user)
    public string? UserAadrmToken   { get; init; }
    public string? UserPolicyToken  { get; init; }
}

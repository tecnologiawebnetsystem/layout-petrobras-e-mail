using System.ComponentModel.DataAnnotations;
namespace MipSdkWorker.Options;

public sealed class EntraIdOptions
{
    public const string SectionName = "EntraId";

    [Required(ErrorMessage = "EntraId:TenantId é obrigatório")]
    public string TenantId { get; init; } = string.Empty;

    [Required(ErrorMessage = "EntraId:ClientId é obrigatório")]
    public string ClientId { get; init; } = string.Empty;

    [Required(ErrorMessage = "EntraId:ClientSecret é obrigatório")]
    public string ClientSecret { get; init; } = string.Empty;
}

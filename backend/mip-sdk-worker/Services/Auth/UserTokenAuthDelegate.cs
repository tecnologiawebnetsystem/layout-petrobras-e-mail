using Microsoft.InformationProtection;

namespace MipSdkWorker.Services.Auth;

/// <summary>
/// IAuthDelegate que serve tokens de usuário pré-adquiridos (Device Code / MSAL popup).
///
/// - aadrmToken : para o recurso Azure RMS / AADRM (https://aadrm.com)
/// - policyToken: para o recurso MIP Policy Sync (https://syncservice.o365syncservice.com)
///                Obrigatório quando ProtectionOnlyEngine = false (alteração de rótulos via SDK).
///                Opcional para operações only-protection (ProtectionOnlyEngine = true).
/// </summary>
public sealed class UserTokenAuthDelegate : IAuthDelegate
{
    private readonly string _aadrmToken;
    private readonly string? _policyToken;
    private readonly ILogger<UserTokenAuthDelegate> _logger;

    public UserTokenAuthDelegate(
        string aadrmToken,
        string? policyToken,
        ILogger<UserTokenAuthDelegate> logger)
    {
        _aadrmToken  = aadrmToken;
        _policyToken = policyToken;
        _logger      = logger;
    }

    public string AcquireToken(
        Identity identity,
        string authority,
        string resource,
        string claims)
    {
        _logger.LogDebug(
            "UserTokenAuthDelegate.AcquireToken: resource={Resource}", resource);

        // Recurso de sincronização de políticas MIP (necessário para ProtectionOnlyEngine=false)
        if (_policyToken != null &&
            (resource.Contains("syncservice", StringComparison.OrdinalIgnoreCase) ||
             resource.Contains("policy",      StringComparison.OrdinalIgnoreCase)))
        {
            return _policyToken;
        }

        // Padrão: token AADRM para operações de proteção RMS
        return _aadrmToken;
    }
}

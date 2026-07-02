using Microsoft.InformationProtection;
using Microsoft.Identity.Client;

namespace MipSdkWorker.Services.Auth;

/// <summary>
/// Implementa o delegate de autenticação exigido pelo MIP SDK.
/// Usa MSAL com client credentials (ClientId + ClientSecret).
/// </summary>
public sealed class MipAuthDelegate : IAuthDelegate
{
    private readonly string _tenantId;
    private readonly string _clientId;
    private readonly string _clientSecret;
    private readonly ILogger<MipAuthDelegate> _logger;
    private readonly IConfidentialClientApplication _app;

    public MipAuthDelegate(
        string tenantId,
        string clientId,
        string clientSecret,
        ILogger<MipAuthDelegate> logger)
    {
        _tenantId = tenantId;
        _clientId = clientId;
        _clientSecret = clientSecret;
        _logger = logger;

        var tenantAuthority = $"https://login.microsoftonline.com/{_tenantId}";

        _app = ConfidentialClientApplicationBuilder
            .Create(_clientId)
            .WithClientSecret(_clientSecret)
            .WithAuthority(tenantAuthority)
            .Build();
    }

    public string AcquireToken(
        Identity identity,
        string authority,
        string resource,
        string claims)
    {
        _logger.LogDebug("MIP AcquireToken: authority={Authority} resource={Resource}", authority, resource);

        // Monta o scope no padrão exigido pelo MIP SDK
        var scope = resource.TrimEnd('/') + "/.default";

        var result = _app
                .AcquireTokenForClient(new[] { scope })
                .ExecuteAsync()
                .ConfigureAwait(false)
                .GetAwaiter()
                .GetResult();


        _logger.LogDebug("MIP token adquirido. Expira em: {ExpiresOn}", result.ExpiresOn);
        return result.AccessToken;
    }
}

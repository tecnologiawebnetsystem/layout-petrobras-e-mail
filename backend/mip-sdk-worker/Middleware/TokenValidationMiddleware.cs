using Microsoft.Extensions.Options;
using MipSdkWorker.Options;
using System.Security.Cryptography;

namespace MipSdkWorker.Middleware;

public class TokenValidationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TokenValidationMiddleware> _logger;
    private readonly MipWorkerOptions _options;

    public TokenValidationMiddleware(
        RequestDelegate next,
        ILogger<TokenValidationMiddleware> logger,
        IOptions<MipWorkerOptions> options)
    {
        _next = next;
        _logger = logger;
        _options = options.Value;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip token validation for health check
        var path = context.Request.Path;
        if (path.Equals("/health", StringComparison.OrdinalIgnoreCase)
            || path.Equals("/health/", StringComparison.OrdinalIgnoreCase)
            || path.Equals("/mip-worker/health", StringComparison.OrdinalIgnoreCase)
            || path.Equals("/mip-worker/health/", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        // Extract Authorization header
        var authHeader = context.Request.Headers.Authorization.ToString();

        if (string.IsNullOrEmpty(authHeader))
        {
            _logger.LogWarning(
                "Request without Authorization header — Path: {Path} | IP: {IP}",
                context.Request.Path,
                context.Connection.RemoteIpAddress);

            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsJsonAsync(new { error = "Missing Authorization header" });
            return;
        }

        // Expected format: "Bearer <token>"
        var parts = authHeader.Split(' ');
        if (parts.Length != 2 || parts[0] != "Bearer")
        {
            _logger.LogWarning(
                "Invalid Authorization header format — Path: {Path} | IP: {IP}",
                context.Request.Path,
                context.Connection.RemoteIpAddress);
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsJsonAsync(new { error = "Invalid Authorization header format" });
            return;
        }

        var token = parts[1];
        var expectedToken = _options.ServiceApiToken;

        if (string.IsNullOrEmpty(expectedToken))
        {
            _logger.LogError("ServiceApiToken not configured — service is misconfigured");
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsJsonAsync(new { error = "Service not properly configured" });
            return;
        }

        if (!CryptographicOperations.FixedTimeEquals(
                System.Text.Encoding.UTF8.GetBytes(token),
                System.Text.Encoding.UTF8.GetBytes(expectedToken)))
        {
            _logger.LogWarning(
                "Invalid token — Path: {Path} | IP: {IP}",
                context.Request.Path,
                context.Connection.RemoteIpAddress);

            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(new { error = "Invalid token" });
            return;
        }

        // Token is valid, proceed
        await _next(context);
    }
}

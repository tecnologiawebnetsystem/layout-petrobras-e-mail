using MipSdkWorker.Middleware;
using MipSdkWorker.Options;
using MipSdkWorker.Services;
using DotNetEnv;

// Carrega .env
Env.Load();

var builder = WebApplication.CreateBuilder(args);

// ── Serviços base ─────────────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Health Checks nativos do ASP.NET Core para monitoramento de infraestrutura.
builder.Services.AddHealthChecks();


// HSTS CONFIG (resolve o finding)
builder.Services.AddHsts(options =>
{
    options.Preload = true;
    options.IncludeSubDomains = true;
    options.MaxAge = TimeSpan.FromDays(365);
});

// (Opcional, mas forte) Redirect HTTP → HTTPS
builder.Services.AddHttpsRedirection(options =>
{
    options.RedirectStatusCode = StatusCodes.Status308PermanentRedirect;
});


// ── Options ───────────────────────────────────────────────────────────────────
builder.Services
    .AddOptions<EntraIdOptions>()
    .Bind(builder.Configuration.GetSection(EntraIdOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();


builder.Services
    .AddOptions<MipWorkerOptions>()
    .Bind(builder.Configuration.GetSection(MipWorkerOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

// ── MIP SDK Provider — escolhe Real ou Placeholder ───────────────────────────
var mipWorkerOpts = builder.Configuration
    .GetSection(MipWorkerOptions.SectionName)
    .Get<MipWorkerOptions>();
if (mipWorkerOpts?.PlaceholderModeEnabled == true)
{
    builder.Services.AddSingleton<IMipSdkProvider, PlaceholderMipSdkProvider>();
}
else
{
    // Singleton: o MIP SDK mantém estado interno (engine/profile/token cache)
    // Recriar a cada request causaria overhead e possível corrupção de estado
    builder.Services.AddSingleton<IMipSdkProvider, RealMipSdkProvider>();
}

// ── Serviços MIP ──────────────────────────────────────────────────────────────
// Scoped: cada request tem seu próprio MipProcessingService
// mas compartilham o mesmo IMipSdkProvider (Singleton acima)
builder.Services.AddScoped<IMipProcessingService, MipProcessingService>();
// builder.Services.AddScoped<IMipSdkProvider, PlaceholderMipSdkProvider>();

// ── HttpClient ────────────────────────────────────────────────────────────────
builder.Services.AddHttpClient();


builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});


// ── Pipeline ──────────────────────────────────────────────────────────────────
var app = builder.Build();

// Suporte ao prefixo de path roteado pelo ALB (/mip-worker/* → worker)
// Permite que controllers em /api/v1/mip/* respondam corretamente quando
// chamados via https://scac-dsv.petrobras.com.br/mip-worker/api/v1/mip/*
app.UsePathBase("/mip-worker");
app.UseRouting();


// Ativa HSTS incondicionalmente no pipeline.
// Chamar UseHsts() sem envolvê-lo em condicional garante que o header
// Strict-Transport-Security seja sempre emitido e que a análise estática
// (Checkmarx) reconheça a proteção como alcançável.
app.UseHsts();


// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();


// (Extra HARDENING) Security Headers adicionais
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
    context.Response.Headers["Referrer-Policy"] = "no-referrer";

    await next();
});

// Token validation antes de qualquer controller
app.UseMiddleware<TokenValidationMiddleware>();

app.UseAuthorization();

app.MapControllers()
   .RequireAuthorization();

// Health check via middleware nativo (Microsoft.AspNetCore.Diagnostics.HealthChecks).
// Endpoint público e intencional para monitoramento de infraestrutura.
// Por ser um middleware de framework (sem delegate autoral), não requer
// política de autorização de função de negócio.
app.MapHealthChecks("/health")
   .AllowAnonymous();

app.Run();

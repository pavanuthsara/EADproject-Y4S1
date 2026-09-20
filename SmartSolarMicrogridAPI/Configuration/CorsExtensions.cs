/*
 * File: CorsExtensions.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Extension methods that configure and apply the CORS policy for the web
 *              and mobile clients.
 *
 * Individual Contribution: Implemented the configuration-driven CORS policy
 *                          registration for the client apps.
 */

namespace SmartSolarMicrogridAPI.Configuration;

public static class CorsExtensions
{
    private const string ClientAppsPolicy = "ClientApps";

    // Registers the ClientApps policy, open to any origin in Development and limited to the configured origins otherwise.
    public static IServiceCollection AddClientAppsCors(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        var settings = configuration.GetSection(CorsSettings.SectionName).Get<CorsSettings>() ?? new CorsSettings();

        services.AddCors(options =>
        {
            options.AddPolicy(ClientAppsPolicy, policy =>
            {
                if (environment.IsDevelopment())
                {
                    policy.AllowAnyOrigin();
                }
                else
                {
                    policy.WithOrigins(settings.AllowedOrigins);
                }

                policy.AllowAnyHeader().AllowAnyMethod();
            });
        });

        return services;
    }

    // Applies the ClientApps CORS policy to the request pipeline.
    public static IApplicationBuilder UseClientAppsCors(this IApplicationBuilder app)
    {
        return app.UseCors(ClientAppsPolicy);
    }
}

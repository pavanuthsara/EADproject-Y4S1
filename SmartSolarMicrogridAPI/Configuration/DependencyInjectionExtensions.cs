/*
 * File: DependencyInjectionExtensions.cs
 * Purpose: Extension methods that register business services with the DI container.
 */

using SmartSolarMicrogridAPI.Services;
using SmartSolarMicrogridAPI.Services.Interfaces;

namespace SmartSolarMicrogridAPI.Configuration;

public static class DependencyInjectionExtensions
{
    // Registers every business service as scoped.
    public static IServiceCollection AddServices(this IServiceCollection services)
    {
        services.AddScoped<IHealthService, HealthService>();

        return services;
    }
}

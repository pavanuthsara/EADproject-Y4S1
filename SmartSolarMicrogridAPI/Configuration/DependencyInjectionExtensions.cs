/*
 * File: DependencyInjectionExtensions.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Extension methods that register business services with the DI container.
 *
 * Individual Contribution: Implemented the dependency injection registration extension
 *                          methods.
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

/*
 * File: DependencyInjectionExtensions.cs
 * Purpose: Extension methods that register repositories and services with the DI container.
 */

using SmartSolarMicrogridAPI.Repositories;
using SmartSolarMicrogridAPI.Repositories.Interfaces;
using SmartSolarMicrogridAPI.Services;
using SmartSolarMicrogridAPI.Services.Interfaces;

namespace SmartSolarMicrogridAPI.Configuration;

public static class DependencyInjectionExtensions
{
    // Registers every repository as scoped.
    public static IServiceCollection AddRepositories(this IServiceCollection services)
    {
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ISolarStationRepository, SolarStationRepository>();
        services.AddScoped<IEnergyBookingSlotRepository, EnergyBookingSlotRepository>();
        services.AddScoped<IEnergyReservationRepository, EnergyReservationRepository>();

        return services;
    }

    // Registers every business service as scoped.
    public static IServiceCollection AddServices(this IServiceCollection services)
    {
        services.AddScoped<IHealthService, HealthService>();

        return services;
    }
}

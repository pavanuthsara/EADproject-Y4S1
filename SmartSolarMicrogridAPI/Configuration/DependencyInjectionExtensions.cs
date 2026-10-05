/*
 * File: DependencyInjectionExtensions.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Extension methods that register business services with the DI container.
 *
 * Individual Contribution: Implemented the dependency injection registration extension
 *                          methods.
 */

using Microsoft.Extensions.DependencyInjection.Extensions;
using SmartSolarMicrogridAPI.Common.Security;
using SmartSolarMicrogridAPI.Data;
using SmartSolarMicrogridAPI.Models.Entities;
using SmartSolarMicrogridAPI.Repositories;
using SmartSolarMicrogridAPI.Repositories.Interfaces;
using SmartSolarMicrogridAPI.Services;
using SmartSolarMicrogridAPI.Services.Interfaces;

namespace SmartSolarMicrogridAPI.Configuration;

public static class DependencyInjectionExtensions
{
    // Registers every business service as scoped.
    public static IServiceCollection AddServices(this IServiceCollection services)
    {
        services.AddScoped<IHealthService, HealthService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IStationService, StationService>();
        services.AddScoped<ITransferService, TransferService>();

        services.AddScoped<IMongoRepository<User>>(sp =>
            new MongoRepository<User>(sp.GetRequiredService<MongoDbContext>().Users));
        services.AddScoped<IMongoRepository<SolarStation>>(sp =>
            new MongoRepository<SolarStation>(sp.GetRequiredService<MongoDbContext>().SolarStations));
        services.AddScoped<IMongoRepository<EnergyBookingSlot>>(sp =>
            new MongoRepository<EnergyBookingSlot>(sp.GetRequiredService<MongoDbContext>().EnergyBookingSlots));
        services.AddScoped<IMongoRepository<EnergyReservation>>(sp =>
            new MongoRepository<EnergyReservation>(sp.GetRequiredService<MongoDbContext>().EnergyReservations));

        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();

        return services;
    }

    // Registers the validated reservation policy, the three narrow repositories and the reservation service.
    public static IServiceCollection AddReservations(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<ReservationPolicyOptions>()
            .Bind(configuration.GetSection(ReservationPolicyOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.TryAddSingleton(TimeProvider.System);

        services.AddScoped<ISolarStationRepository, SolarStationRepository>();
        services.AddScoped<IEnergyBookingSlotRepository, EnergyBookingSlotRepository>();
        services.AddScoped<IEnergyReservationRepository, EnergyReservationRepository>();
        services.AddScoped<IReservationService, ReservationService>();
        services.AddScoped<ISlotService, SlotService>();

        return services;
    }
}

/*
 * File: MongoDbExtensions.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Extension methods that register MongoDB services and verify the
 *              connection at startup.
 *
 * Individual Contribution: Implemented MongoDB service registration with validated
 *                          settings, the startup connection check and its console logging.
 */

using Microsoft.Extensions.Options;
using MongoDB.Driver;
using SmartSolarMicrogridAPI.Data;

namespace SmartSolarMicrogridAPI.Configuration;

public static class MongoDbExtensions
{
    // Binds and validates MongoDbSettings and registers the Mongo client and database context as singletons.
    public static IServiceCollection AddMongoDb(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<MongoDbSettings>()
            .Bind(configuration.GetSection(MongoDbSettings.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddSingleton<IMongoClient>(sp =>
            new MongoClient(sp.GetRequiredService<IOptions<MongoDbSettings>>().Value.ConnectionString));

        services.AddSingleton<MongoDbContext>();

        return services;
    }

    // Pings MongoDB, logs the outcome to the console, and creates the required indexes.
    public static async Task InitializeMongoDbAsync(this WebApplication app)
    {
        var context = app.Services.GetRequiredService<MongoDbContext>();

        try
        {
            await context.PingAsync();
            app.Logger.LogInformation("MongoDB connection successful. Database: {DatabaseName}", context.DatabaseName);
        }
        catch (Exception ex)
        {
            app.Logger.LogError(ex, "MongoDB connection FAILED. Check MongoDbSettings__ConnectionString in .env or user-secrets.");
            throw;
        }

        await context.CreateIndexesAsync();
    }
}

/*
 * File: MongoDbExtensions.cs
 * Purpose: Extension methods that register MongoDB services and verify the connection at startup.
 */

using Microsoft.Extensions.Options;
using MongoDB.Driver;
using SmartSolarMicrogridAPI.Data;

namespace SmartSolarMicrogridAPI.Configuration;

public static class MongoDbExtensions
{
    // Binds MongoDbSettings and registers the Mongo client and database context as singletons.
    public static IServiceCollection AddMongoDb(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<MongoDbSettings>(configuration.GetSection(MongoDbSettings.SectionName));

        services.AddSingleton<IMongoClient>(sp =>
        {
            var settings = sp.GetRequiredService<IOptions<MongoDbSettings>>().Value;

            if (string.IsNullOrWhiteSpace(settings.ConnectionString)
                || settings.ConnectionString == MongoDbSettings.PlaceholderConnectionString)
            {
                throw new InvalidOperationException(
                    "MongoDbSettings:ConnectionString is not configured. Set it with dotnet user-secrets.");
            }

            return new MongoClient(settings.ConnectionString);
        });

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
            app.Logger.LogError(ex, "MongoDB connection FAILED. Check MongoDbSettings:ConnectionString in user-secrets.");
            throw;
        }

        await context.CreateIndexesAsync();
    }
}

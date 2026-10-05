/*
 * File: HealthService.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 42
 * Description: Checks MongoDB connectivity and reports the database status.
 *
 * Individual Contribution: Implemented the database health check with response timing
 *                          and a configurable timeout.
 */

using System.Diagnostics;
using Microsoft.Extensions.Options;
using SmartSolarMicrogridAPI.Configuration;
using SmartSolarMicrogridAPI.Data;
using SmartSolarMicrogridAPI.DTOs.Responses;
using SmartSolarMicrogridAPI.Services.Interfaces;

namespace SmartSolarMicrogridAPI.Services;

public class HealthService(
    MongoDbContext context,
    IOptions<MongoDbSettings> options,
    ILogger<HealthService> logger) : IHealthService
{
    private readonly TimeSpan _pingTimeout = TimeSpan.FromSeconds(options.Value.PingTimeoutSeconds);

    // Pings MongoDB and returns whether it is reachable together with the database name.
    public async Task<HealthStatusResponse> GetHealthAsync()
    {
        var response = new HealthStatusResponse { DatabaseName = context.DatabaseName };
        var stopwatch = Stopwatch.StartNew();

        try
        {
            using var cts = new CancellationTokenSource(_pingTimeout);
            await context.PingAsync(cts.Token);
            response.DatabaseConnected = true;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "MongoDB ping failed");
        }

        response.ResponseTimeMs = stopwatch.ElapsedMilliseconds;
        return response;
    }
}

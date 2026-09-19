/*
 * File: HealthService.cs
 * Purpose: Checks MongoDB connectivity and reports the database status.
 */

using SmartSolarMicrogridAPI.Data;
using SmartSolarMicrogridAPI.DTOs.Responses;
using SmartSolarMicrogridAPI.Services.Interfaces;

namespace SmartSolarMicrogridAPI.Services;

public class HealthService : IHealthService
{
    private static readonly TimeSpan PingTimeout = TimeSpan.FromSeconds(5);

    private readonly MongoDbContext _context;
    private readonly ILogger<HealthService> _logger;

    // Stores the database context and logger.
    public HealthService(MongoDbContext context, ILogger<HealthService> logger)
    {
        _context = context;
        _logger = logger;
    }

    // Pings MongoDB and returns whether it is reachable together with the database name.
    public async Task<HealthStatusResponse> GetHealthAsync()
    {
        var response = new HealthStatusResponse { DatabaseName = _context.DatabaseName };

        try
        {
            using var cts = new CancellationTokenSource(PingTimeout);
            await _context.PingAsync(cts.Token);
            response.DatabaseConnected = true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "MongoDB ping failed");
        }

        return response;
    }
}

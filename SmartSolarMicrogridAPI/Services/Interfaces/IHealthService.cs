/*
 * File: IHealthService.cs
 * Purpose: Defines the contract for checking API and database health.
 */

using SmartSolarMicrogridAPI.DTOs.Responses;

namespace SmartSolarMicrogridAPI.Services.Interfaces;

public interface IHealthService
{
    Task<HealthStatusResponse> GetHealthAsync();
}

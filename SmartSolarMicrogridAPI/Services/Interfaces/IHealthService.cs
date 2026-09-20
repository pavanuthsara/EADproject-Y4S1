/*
 * File: IHealthService.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Defines the contract for checking API and database health.
 *
 * Individual Contribution: Defined the health service contract.
 */

using SmartSolarMicrogridAPI.DTOs.Responses;

namespace SmartSolarMicrogridAPI.Services.Interfaces;

public interface IHealthService
{
    Task<HealthStatusResponse> GetHealthAsync();
}

/*
 * File: IStationService.cs
 * Author: Ransilu Samaraweera
 * Group: 45
 * Description: Interface for solar station management service.
 * Individual Contribution: Defined the station service interface for registration,
 *                          schedule updates and deactivation.
 */

using SmartSolarMicrogridAPI.DTOs.Requests;
using SmartSolarMicrogridAPI.DTOs.Responses;

namespace SmartSolarMicrogridAPI.Services.Interfaces;

public interface IStationService
{
    Task<StationResponseDto> CreateStationAsync(CreateStationRequestDto dto, string createdByUserId);
    Task<StationResponseDto> UpdateOperatingScheduleAsync(string stationId, UpdateOperatingScheduleRequestDto dto);
    Task<StationResponseDto> DeactivateStationAsync(string stationId, string deactivatedByUserId);
    Task<StationResponseDto> ActivateStationAsync(string stationId);
    Task<IEnumerable<StationResponseDto>> GetNearbyStationsAsync(double latitude, double longitude, double maxDistanceMeters = 10000);
    Task<IEnumerable<StationResponseDto>> GetAllStationsAsync();
}

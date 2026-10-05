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
    // Registers a new solar station.
    Task<StationResponseDto> CreateStationAsync(CreateStationRequestDto dto, string createdByUserId);
    // Replaces a station's daily operating schedule.
    Task<StationResponseDto> UpdateOperatingScheduleAsync(string stationId, UpdateOperatingScheduleRequestDto dto);
    // Deactivates a station that has no active reservations.
    Task<StationResponseDto> DeactivateStationAsync(string stationId, string deactivatedByUserId);
    // Reactivates a deactivated station.
    Task<StationResponseDto> ActivateStationAsync(string stationId);
    // Finds stations within a radius of the given coordinates.
    Task<IEnumerable<StationResponseDto>> GetNearbyStationsAsync(double latitude, double longitude, double maxDistanceMeters = 10000);
    // Returns every station.
    Task<IEnumerable<StationResponseDto>> GetAllStationsAsync();
}

/*
 * File: StationService.cs
 * Author: Ransilu Samaraweera
 * Group: 42
 * Description: Implementation of solar station management business logic.
 * Individual Contribution: Implemented station registration, schedule updates and
 *                          deactivation guarded by active energy reservations.
 */

using MongoDB.Driver;
using MongoDB.Driver.GeoJsonObjectModel;
using SmartSolarMicrogridAPI.Common.Enums;
using SmartSolarMicrogridAPI.Common.Exceptions;
using SmartSolarMicrogridAPI.Common.Helpers;
using SmartSolarMicrogridAPI.DTOs.Requests;
using SmartSolarMicrogridAPI.DTOs.Responses;
using SmartSolarMicrogridAPI.Models.Entities;
using SmartSolarMicrogridAPI.Repositories.Interfaces;
using SmartSolarMicrogridAPI.Services.Interfaces;

namespace SmartSolarMicrogridAPI.Services;

public class StationService(
    IMongoRepository<SolarStation> stationRepository,
    IMongoRepository<EnergyReservation> reservationRepository,
    ISolarStationRepository solarStationQueryRepository) : IStationService
{
    // Registers a new station as Active with its GPS location, capacity and battery storage slots.
    public async Task<StationResponseDto> CreateStationAsync(CreateStationRequestDto dto, string createdByUserId)
    {
        string stationCode = dto.StationCode.Trim().ToUpperInvariant();
        EnsureValidOperatingWindow(dto.OperatingSchedule);

        bool codeExists = await stationRepository.ExistsAsync(s => s.StationCode == stationCode);
        if (codeExists)
            throw new BusinessRuleException("A station with this code already exists.");

        var station = new SolarStation
        {
            StationName = dto.StationName.Trim(),
            StationCode = stationCode,
            // GeoJSON expects longitude first, then latitude.
            Location = new GeoJsonPoint<GeoJson2DGeographicCoordinates>(
                new GeoJson2DGeographicCoordinates(dto.Longitude!.Value, dto.Latitude!.Value)),
            AddressLine = dto.AddressLine.Trim(),
            City = dto.City.Trim(),
            CapacityKwh = dto.CapacityKwh,
            TotalBays = dto.TotalBays,
            OperatingSchedule = dto.OperatingSchedule,
            Status = StationStatus.Active.ToString(),
            CreatedBy = createdByUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        try
        {
            var created = await stationRepository.CreateAsync(station);
            return MapStation(created);
        }
        catch (MongoWriteException ex) when (ex.WriteError.Category == ServerErrorCategory.DuplicateKey)
        {
            // Two requests with the same code raced past the check above; the unique index caught it.
            throw new BusinessRuleException("A station with this code already exists.");
        }
    }

    // Replaces a station's daily operating window ("HH:mm-HH:mm").
    public async Task<StationResponseDto> UpdateOperatingScheduleAsync(string stationId, UpdateOperatingScheduleRequestDto dto)
    {
        var station = await stationRepository.GetByIdAsync(stationId);
        if (station == null)
            throw new NotFoundException($"Station {stationId} not found.");

        if (station.Status != StationStatus.Active.ToString())
            throw new BusinessRuleException("Schedules cannot be changed for an inactive station.");

        EnsureValidOperatingWindow(dto.OperatingSchedule);

        station.OperatingSchedule = dto.OperatingSchedule;
        station.UpdatedAt = DateTime.UtcNow;

        await stationRepository.UpdateAsync(station.Id, station);

        return MapStation(station);
    }

    // Deactivates a station, refusing while any Pending or Approved reservation is tied to it.
    public async Task<StationResponseDto> DeactivateStationAsync(string stationId, string deactivatedByUserId)
    {
        var station = await stationRepository.GetByIdAsync(stationId);
        if (station == null)
            throw new NotFoundException($"Station {stationId} not found.");

        if (station.Status == StationStatus.Inactive.ToString())
            throw new BusinessRuleException("This station is already deactivated.");

        // Check-then-update: a reservation created between this check and the update is not caught.
        var activeReservations = await GetActiveReservationsForStationAsync(stationId);
        if (activeReservations.Count > 0)
            throw new BusinessRuleException(
                $"This station cannot be deactivated because it has {activeReservations.Count} active energy reservation(s). " +
                "Complete, cancel or reject them first.");

        station.Status = StationStatus.Inactive.ToString();
        station.DeactivatedBy = deactivatedByUserId;
        station.DeactivatedAt = DateTime.UtcNow;
        station.UpdatedAt = DateTime.UtcNow;

        await stationRepository.UpdateAsync(station.Id, station);

        return MapStation(station);
    }

    // Activates a previously deactivated station.
    public async Task<StationResponseDto> ActivateStationAsync(string stationId)
    {
        var station = await stationRepository.GetByIdAsync(stationId);
        if (station == null)
            throw new NotFoundException($"Station {stationId} not found.");

        if (station.Status == StationStatus.Active.ToString())
            throw new BusinessRuleException("This station is already active.");

        station.Status = StationStatus.Active.ToString();
        station.DeactivatedBy = null;
        station.DeactivatedAt = null;
        station.UpdatedAt = DateTime.UtcNow;

        await stationRepository.UpdateAsync(station.Id, station);

        return MapStation(station);
    }

    // Active reservations are Pending or Approved; Rejected, Completed and Cancelled are finished.
    // Statuses are stored as strings, so they are resolved to locals before being used in a query.
    private Task<IReadOnlyList<EnergyReservation>> GetActiveReservationsForStationAsync(string stationId)
    {
        string pending = ReservationStatus.Pending.ToString();
        string approved = ReservationStatus.Approved.ToString();

        return reservationRepository.FindAsync(r =>
            r.StationId == stationId && (r.Status == pending || r.Status == approved));
    }

    // The DTO already enforces the HH:mm-HH:mm format; this enforces the window itself.
    private static void EnsureValidOperatingWindow(string operatingSchedule)
    {
        if (!OperatingScheduleHelper.HasValidWindow(operatingSchedule))
            throw new BusinessRuleException("The operating schedule must close after it opens on the same day.");
    }

    public async Task<IEnumerable<StationResponseDto>> GetNearbyStationsAsync(double latitude, double longitude, double maxDistanceMeters = 10000)
    {
        // Notice the interface expects (longitude, latitude) as standard GeoJSON
        var stations = await solarStationQueryRepository.FindNearbyAsync(longitude, latitude, maxDistanceMeters);
        
        return stations.Select(MapStation).ToList();
    }

    // Returns every station, active or not.
    public async Task<IEnumerable<StationResponseDto>> GetAllStationsAsync()
    {
        var stations = await stationRepository.FindAsync(_ => true);
        return stations.Select(MapStation).ToList();
    }

    // Maps a station entity to the response DTO returned by the API.
    private static StationResponseDto MapStation(SolarStation station) => new()
    {
        Id = station.Id,
        StationName = station.StationName,
        StationCode = station.StationCode,
        Latitude = station.Location.Coordinates.Latitude,
        Longitude = station.Location.Coordinates.Longitude,
        AddressLine = station.AddressLine,
        City = station.City,
        CapacityKwh = station.CapacityKwh,
        TotalBays = station.TotalBays,
        OperatingSchedule = station.OperatingSchedule,
        Status = station.Status,
        CreatedAt = station.CreatedAt,
        DeactivatedAt = station.DeactivatedAt
    };
}

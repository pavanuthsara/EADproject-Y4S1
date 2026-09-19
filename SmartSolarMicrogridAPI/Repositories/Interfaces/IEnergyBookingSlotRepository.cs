/*
 * File: IEnergyBookingSlotRepository.cs
 * Purpose: Defines booking-slot-specific data access on top of the generic repository contract.
 */

using SmartSolarMicrogridAPI.Models.Entities;

namespace SmartSolarMicrogridAPI.Repositories.Interfaces;

public interface IEnergyBookingSlotRepository : IMongoRepository<EnergyBookingSlot>
{
    Task<IReadOnlyList<EnergyBookingSlot>> GetByStationIdAsync(string stationId);
    Task<IReadOnlyList<EnergyBookingSlot>> GetByDateRangeAsync(DateTime fromUtc, DateTime toUtc);
}

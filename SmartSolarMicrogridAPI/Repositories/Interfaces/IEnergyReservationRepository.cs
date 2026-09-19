/*
 * File: IEnergyReservationRepository.cs
 * Purpose: Defines reservation-specific data access on top of the generic repository contract.
 */

using SmartSolarMicrogridAPI.Models.Entities;

namespace SmartSolarMicrogridAPI.Repositories.Interfaces;

public interface IEnergyReservationRepository : IMongoRepository<EnergyReservation>
{
    Task<IReadOnlyList<EnergyReservation>> GetByProsumerNicAsync(string prosumerNic);
    Task<IReadOnlyList<EnergyReservation>> GetBySlotIdAsync(string slotId);
    Task<EnergyReservation?> GetByQrTokenAsync(string qrToken);
    Task<bool> HasActiveReservationsForStationAsync(string stationId);
}

using SmartSolarMicrogridAPI.DTOs.Requests;
using SmartSolarMicrogridAPI.DTOs.Responses;

namespace SmartSolarMicrogridAPI.Services.Interfaces;

public interface ISlotService
{
    // Creates a booking slot inside a station.
    Task<ScheduleResponseDto> CreateSlotAsync(string stationId, SlotRequestDto dto);

    // Replaces the details of a slot.
    Task<ScheduleResponseDto> UpdateSlotAsync(string stationId, string slotId, SlotRequestDto dto);

    // Deletes a slot that has no active reservations.
    Task DeleteSlotAsync(string stationId, string slotId);

    // Opens or closes a slot to new bookings; existing bookings are not affected.
    Task<ScheduleResponseDto> SetAvailabilityAsync(string stationId, string slotId, bool open);

    // Staff get every slot; a prosumer only gets slots they could still book.
    Task<IEnumerable<ScheduleResponseDto>> GetSlotsAsync(string stationId, bool isStaff);
}

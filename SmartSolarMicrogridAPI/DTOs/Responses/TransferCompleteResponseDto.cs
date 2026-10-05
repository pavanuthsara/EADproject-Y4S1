/*
 * File: TransferCompleteResponseDto.cs
 * Author: Damith Chandrathilaka (IT23168336)
 * Group: 42
 * Description: DTO returned when an energy transfer job is marked as completed.
 * Individual Contribution: Implemented transfer completion response data transfer object.
 */

namespace SmartSolarMicrogridAPI.DTOs.Responses;

public class TransferCompleteResponseDto
{
    public string ReservationId { get; set; } = string.Empty;
    public string ReservationNo { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string CompletedBy { get; set; } = string.Empty;
    public DateTime CompletedAt { get; set; }
}

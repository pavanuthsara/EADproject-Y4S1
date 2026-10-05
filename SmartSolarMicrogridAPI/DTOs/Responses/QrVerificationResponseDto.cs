/*
 * File: QrVerificationResponseDto.cs
 * Author: Damith Chandrathilaka (IT23168336)
 * Group: 42
 * Description: DTO containing reservation details returned upon successful QR code verification.
 * Individual Contribution: Implemented QR verification response data transfer object.
 */

namespace SmartSolarMicrogridAPI.DTOs.Responses;

public class QrVerificationResponseDto
{
    public string ReservationId { get; set; } = string.Empty;
    public string ReservationNo { get; set; } = string.Empty;
    public string ProsumerId { get; set; } = string.Empty;
    public string ProsumerNic { get; set; } = string.Empty;
    public string StationId { get; set; } = string.Empty;
    public string SlotId { get; set; } = string.Empty;
    public DateTime SlotStartTime { get; set; }
    public string Direction { get; set; } = string.Empty;
    public double RequestedKwh { get; set; }
    public string Status { get; set; } = string.Empty;
    public string QrToken { get; set; } = string.Empty;
    public DateTime? ApprovedAt { get; set; }
}

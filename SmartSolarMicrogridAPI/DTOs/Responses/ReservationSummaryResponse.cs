/*
 * File: ReservationSummaryResponse.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Summary of an energy reservation returned by the create, update and cancel
 *              endpoints. All times are UTC.
 *
 * Individual Contribution: Defined the reservation summary contract shared with the web
 *                          and mobile clients.
 */

using SmartSolarMicrogridAPI.Common.Enums;

namespace SmartSolarMicrogridAPI.DTOs.Responses;

public class ReservationSummaryResponse
{
    public string ReservationId { get; set; } = string.Empty;
    public string ReservationNo { get; set; } = string.Empty;
    public string ProsumerNic { get; set; } = string.Empty;
    public ReservationStatus Status { get; set; }
    public string StationId { get; set; } = string.Empty;
    public string StationName { get; set; } = string.Empty;
    public string SlotId { get; set; } = string.Empty;
    public DateTime SlotStartUtc { get; set; }
    public DateTime SlotEndUtc { get; set; }
    public EnergyDirection Direction { get; set; }
    public double RequestedKwh { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public bool CanModify { get; set; }
    public bool CanCancel { get; set; }
    public string Message { get; set; } = string.Empty;
}

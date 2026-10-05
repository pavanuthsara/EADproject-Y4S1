/*
 * File: EnergyReservation.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 42
 * Description: Entity mapped to the energyReservations collection. C# time properties end
 *              in Utc while the stored field names stay unchanged.
 *
 * Individual Contribution: Implemented the EnergyReservation entity and its BSON
 *                          mapping, including the copied slot window, UTC naming,
 *                          typed status and direction, and the concurrency version.
 */

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using SmartSolarMicrogridAPI.Common.Enums;

namespace SmartSolarMicrogridAPI.Models.Entities;

public class EnergyReservation : IEntity
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("reservationNo")]
    public string ReservationNo { get; set; } = string.Empty;

    [BsonElement("prosumerId")]
    public string ProsumerId { get; set; } = string.Empty;

    [BsonElement("prosumerNic")]
    public string ProsumerNic { get; set; } = string.Empty;

    [BsonElement("slotId")]
    public string SlotId { get; set; } = string.Empty;

    [BsonElement("stationId")]
    public string StationId { get; set; } = string.Empty;

    // Copied from the slot so rule checks do not need to re-read it.
    [BsonElement("slotStartTime")]
    public DateTime SlotStartUtc { get; set; }

    [BsonElement("slotEndTime")]
    public DateTime SlotEndUtc { get; set; }

    [BsonElement("direction")]
    public string Direction { get; set; } = string.Empty;

    [BsonElement("requestedKwh")]
    public double RequestedKwh { get; set; }

    [BsonElement("status")]
    public string Status { get; set; } = string.Empty;

    [BsonElement("qrToken")]
    public string QrToken { get; set; } = string.Empty;

    [BsonElement("approvedBy")]
    public string? ApprovedBy { get; set; }

    [BsonElement("approvedAt")]
    public DateTime? ApprovedAtUtc { get; set; }

    [BsonElement("rejectedAt")]
    public DateTime? RejectedAtUtc { get; set; }

    [BsonElement("rejectedBy")]
    public string? RejectedBy { get; set; }

    [BsonElement("rejectionReason")]
    public string? RejectionReason { get; set; }

    [BsonElement("completedBy")]
    public string? CompletedBy { get; set; }

    [BsonElement("completedAt")]
    public DateTime? CompletedAtUtc { get; set; }

    [BsonElement("cancelledBy")]
    public string? CancelledBy { get; set; }

    [BsonElement("cancelledAt")]
    public DateTime? CancelledAtUtc { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAtUtc { get; set; }

    [BsonElement("updatedAt")]
    public DateTime UpdatedAtUtc { get; set; }

    // Incremented on every save so that two concurrent writes cannot both succeed.
    [BsonElement("version")]
    public int Version { get; set; }

    // Typed view of Status; the database keeps the enum name as a string.
    [BsonIgnore]
    public ReservationStatus StatusValue
    {
        get => Enum.Parse<ReservationStatus>(Status);
        set => Status = value.ToString();
    }

    // Typed view of Direction; the database keeps the enum name as a string.
    [BsonIgnore]
    public EnergyDirection DirectionValue
    {
        get => Enum.Parse<EnergyDirection>(Direction);
        set => Direction = value.ToString();
    }
}

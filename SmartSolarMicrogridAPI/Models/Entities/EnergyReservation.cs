/*
 * File: EnergyReservation.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Entity mapped to the energyReservations collection.
 *
 * Individual Contribution: Implemented the EnergyReservation entity and its BSON
 *                          mapping.
 */

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

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

    [BsonElement("slotStartTime")]
    public DateTime SlotStartTime { get; set; }

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
    public DateTime? ApprovedAt { get; set; }

    [BsonElement("rejectedAt")]
    public DateTime? RejectedAt { get; set; }

    [BsonElement("completedBy")]
    public string? CompletedBy { get; set; }

    [BsonElement("completedAt")]
    public DateTime? CompletedAt { get; set; }

    [BsonElement("cancelledBy")]
    public string? CancelledBy { get; set; }

    [BsonElement("cancelledAt")]
    public DateTime? CancelledAt { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; }

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; }
}

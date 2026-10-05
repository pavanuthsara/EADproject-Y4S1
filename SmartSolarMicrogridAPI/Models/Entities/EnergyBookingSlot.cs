/*
 * File: EnergyBookingSlot.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 42
 * Description: Entity mapped to the energyBookingSlots collection.
 *
 * Individual Contribution: Implemented the EnergyBookingSlot entity and its BSON
 *                          mapping, including the kWh and position capacity counters
 *                          and supported directions used by reservations.
 */

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using SmartSolarMicrogridAPI.Common.Enums;

namespace SmartSolarMicrogridAPI.Models.Entities;

public class EnergyBookingSlot : IEntity
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("stationId")]
    public string StationId { get; set; } = string.Empty;

    [BsonElement("startTime")]
    public DateTime StartTime { get; set; }

    [BsonElement("endTime")]
    public DateTime EndTime { get; set; }

    [BsonElement("totalPositions")]
    public int TotalPositions { get; set; }

    [BsonElement("reservedPositions")]
    public int ReservedPositions { get; set; }

    [BsonElement("capacityKwh")]
    public double CapacityKwh { get; set; }

    [BsonElement("reservedKwh")]
    public double ReservedKwh { get; set; }

    // Empty means the slot accepts both Inject and Draw reservations.
    [BsonElement("supportedDirections")]
    public List<string> SupportedDirections { get; set; } = new();

    [BsonElement("status")]
    public string Status { get; set; } = string.Empty;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; }

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; }

    // Typed view of Status; the database keeps the enum name as a string.
    [BsonIgnore]
    public SlotStatus StatusValue => Enum.Parse<SlotStatus>(Status);

    // Typed view of SupportedDirections; the database keeps the enum names as strings.
    [BsonIgnore]
    public IReadOnlyList<EnergyDirection> SupportedDirectionValues =>
        SupportedDirections.Select(Enum.Parse<EnergyDirection>).ToList();
}

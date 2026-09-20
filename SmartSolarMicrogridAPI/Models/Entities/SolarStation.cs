/*
 * File: SolarStation.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Entity mapped to the solarStations collection.
 *
 * Individual Contribution: Implemented the SolarStation entity, including its GeoJSON
 *                          location mapping.
 */

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Driver.GeoJsonObjectModel;

namespace SmartSolarMicrogridAPI.Models.Entities;

public class SolarStation : IEntity
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("stationName")]
    public string StationName { get; set; } = string.Empty;

    [BsonElement("stationCode")]
    public string StationCode { get; set; } = string.Empty;

    [BsonElement("location")]
    public GeoJsonPoint<GeoJson2DGeographicCoordinates> Location { get; set; } =
        new(new GeoJson2DGeographicCoordinates(0, 0));

    [BsonElement("addressLine")]
    public string AddressLine { get; set; } = string.Empty;

    [BsonElement("city")]
    public string City { get; set; } = string.Empty;

    [BsonElement("capacityKwh")]
    public double CapacityKwh { get; set; }

    [BsonElement("totalBays")]
    public int TotalBays { get; set; }

    [BsonElement("status")]
    public string Status { get; set; } = string.Empty;

    [BsonElement("createdBy")]
    public string CreatedBy { get; set; } = string.Empty;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; }

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; }
}

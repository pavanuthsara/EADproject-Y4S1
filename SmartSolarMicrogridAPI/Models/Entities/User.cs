/*
 * File: User.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Entity mapped to the users collection.
 *
 * Individual Contribution: Implemented the User entity and its BSON mapping.
 */

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarMicrogridAPI.Models.Entities;

public class User : IEntity
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("role")]
    public string Role { get; set; } = string.Empty;

    [BsonElement("nic")]
    public string Nic { get; set; } = string.Empty;

    [BsonElement("fullName")]
    public string FullName { get; set; } = string.Empty;

    [BsonElement("email")]
    public string Email { get; set; } = string.Empty;

    [BsonElement("phone")]
    public string Phone { get; set; } = string.Empty;

    [BsonElement("passwordHash")]
    public string PasswordHash { get; set; } = string.Empty;

    [BsonElement("accountStatus")]
    public string AccountStatus { get; set; } = string.Empty;

    [BsonElement("address")]
    public string Address { get; set; } = string.Empty;

    [BsonElement("solarCapacityKw")]
    public double SolarCapacityKw { get; set; }

    [BsonElement("activatedBy")]
    public string? ActivatedBy { get; set; }

    [BsonElement("activatedAt")]
    public DateTime? ActivatedAt { get; set; }

    [BsonElement("deactivatedBy")]
    public string? DeactivatedBy { get; set; }

    [BsonElement("deactivatedAt")]
    public DateTime? DeactivatedAt { get; set; }

    [BsonElement("reactivatedBy")]
    public string? ReactivatedBy { get; set; }

    [BsonElement("reactivatedAt")]
    public DateTime? ReactivatedAt { get; set; }

    [BsonElement("assignedStationIds")]
    public List<string> AssignedStationIds { get; set; } = new();

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; }

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; }
}

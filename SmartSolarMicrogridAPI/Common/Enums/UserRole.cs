/*
 * File: UserRole.cs
 * Purpose: Defines the roles a system user can hold.
 */

using System.Text.Json.Serialization;

namespace SmartSolarMicrogridAPI.Common.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum UserRole
{
    Backoffice,
    GridOperator,
    Prosumer
}

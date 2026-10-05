/*
 * File: UserRole.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 42
 * Description: Defines the roles a system user can hold.
 *
 * Individual Contribution: Defined the UserRole enum for the system roles.
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

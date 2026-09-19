/*
 * File: AccountStatus.cs
 * Purpose: Defines the lifecycle states of a user account.
 */

using System.Text.Json.Serialization;

namespace SmartSolarMicrogridAPI.Common.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AccountStatus
{
    Pending,
    Active,
    Deactivated
}

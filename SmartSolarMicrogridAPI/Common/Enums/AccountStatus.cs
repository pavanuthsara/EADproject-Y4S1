/*
 * File: AccountStatus.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 42
 * Description: Defines the lifecycle states of a user account.
 *
 * Individual Contribution: Defined the AccountStatus enum for the user account
 *                          lifecycle.
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

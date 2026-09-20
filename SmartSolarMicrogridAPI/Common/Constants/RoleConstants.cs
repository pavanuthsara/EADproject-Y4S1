/*
 * File: RoleConstants.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Holds role name strings matching the UserRole enum for use in attributes
 *              and comparisons.
 *
 * Individual Contribution: Defined the role name constants that match the UserRole
 *                          enum.
 */

using SmartSolarMicrogridAPI.Common.Enums;

namespace SmartSolarMicrogridAPI.Common.Constants;

public static class RoleConstants
{
    public const string Backoffice = nameof(UserRole.Backoffice);
    public const string GridOperator = nameof(UserRole.GridOperator);
    public const string Prosumer = nameof(UserRole.Prosumer);
}

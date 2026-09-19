/*
 * File: RoleConstants.cs
 * Purpose: Holds role name strings matching the UserRole enum for use in attributes and comparisons.
 */

using SmartSolarMicrogridAPI.Common.Enums;

namespace SmartSolarMicrogridAPI.Common.Constants;

public static class RoleConstants
{
    public const string Backoffice = nameof(UserRole.Backoffice);
    public const string GridOperator = nameof(UserRole.GridOperator);
    public const string Prosumer = nameof(UserRole.Prosumer);
}

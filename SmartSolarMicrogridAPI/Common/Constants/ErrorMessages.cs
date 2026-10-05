/*
 * File: ErrorMessages.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 42
 * Description: Holds placeholder error messages returned to API clients.
 *
 * Individual Contribution: Defined the shared error messages returned to API clients.
 */

namespace SmartSolarMicrogridAPI.Common.Constants;

public static class ErrorMessages
{
    public const string NotFound = "The requested resource was not found.";
    public const string Forbidden = "You do not have permission to perform this action.";
    public const string BusinessRuleViolation = "The request violates a business rule.";
    public const string InternalServerError = "An unexpected error occurred.";
    public const string DatabaseUnreachable = "Database is unreachable.";
}

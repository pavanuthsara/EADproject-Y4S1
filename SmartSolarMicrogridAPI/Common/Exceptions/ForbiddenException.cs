/*
 * File: ForbiddenException.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 42
 * Description: Signals that the caller is not allowed to perform an action and maps to
 *              HTTP 403.
 *
 * Individual Contribution: Implemented the exception that the middleware maps to HTTP
 *                          403.
 */

namespace SmartSolarMicrogridAPI.Common.Exceptions;

public class ForbiddenException(string message) : Exception(message);

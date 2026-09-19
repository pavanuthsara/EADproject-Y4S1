/*
 * File: ForbiddenException.cs
 * Purpose: Signals that the caller is not allowed to perform an action and maps to HTTP 403.
 */

namespace SmartSolarMicrogridAPI.Common.Exceptions;

public class ForbiddenException(string message) : Exception(message);

/*
 * File: NotFoundException.cs
 * Purpose: Signals that a requested resource does not exist and maps to HTTP 404.
 */

namespace SmartSolarMicrogridAPI.Common.Exceptions;

public class NotFoundException(string message) : Exception(message);

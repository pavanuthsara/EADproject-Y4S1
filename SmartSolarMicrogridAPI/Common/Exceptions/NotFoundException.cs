/*
 * File: NotFoundException.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 42
 * Description: Signals that a requested resource does not exist and maps to HTTP 404.
 *
 * Individual Contribution: Implemented the exception that the middleware maps to HTTP
 *                          404.
 */

namespace SmartSolarMicrogridAPI.Common.Exceptions;

public class NotFoundException(string message) : Exception(message);

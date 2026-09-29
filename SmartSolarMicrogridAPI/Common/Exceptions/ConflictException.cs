/*
 * File: ConflictException.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Signals that a request conflicts with the current state of a resource and
 *              maps to HTTP 409.
 *
 * Individual Contribution: Implemented the exception that the middleware maps to HTTP 409
 *                          for invalid reservation states and concurrent changes.
 */

namespace SmartSolarMicrogridAPI.Common.Exceptions;

public class ConflictException(string message) : Exception(message);

/*
 * File: BusinessRuleException.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 42
 * Description: Signals that a request violates a business rule and maps to HTTP 400.
 *
 * Individual Contribution: Implemented the exception that the middleware maps to HTTP
 *                          400.
 */

namespace SmartSolarMicrogridAPI.Common.Exceptions;

public class BusinessRuleException(string message) : Exception(message);

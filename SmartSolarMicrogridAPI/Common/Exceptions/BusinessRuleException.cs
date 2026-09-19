/*
 * File: BusinessRuleException.cs
 * Purpose: Signals that a request violates a business rule and maps to HTTP 400.
 */

namespace SmartSolarMicrogridAPI.Common.Exceptions;

public class BusinessRuleException : Exception
{
    // Creates the exception with the message returned to the client.
    public BusinessRuleException(string message) : base(message)
    {
    }
}

/*
 * File: NotFoundException.cs
 * Purpose: Signals that a requested resource does not exist and maps to HTTP 404.
 */

namespace SmartSolarMicrogridAPI.Common.Exceptions;

public class NotFoundException : Exception
{
    // Creates the exception with the message returned to the client.
    public NotFoundException(string message) : base(message)
    {
    }
}

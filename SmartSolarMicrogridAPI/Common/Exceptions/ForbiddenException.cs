/*
 * File: ForbiddenException.cs
 * Purpose: Signals that the caller is not allowed to perform an action and maps to HTTP 403.
 */

namespace SmartSolarMicrogridAPI.Common.Exceptions;

public class ForbiddenException : Exception
{
    // Creates the exception with the message returned to the client.
    public ForbiddenException(string message) : base(message)
    {
    }
}

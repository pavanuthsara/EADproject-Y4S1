/*
 * File: IPasswordHasher.cs
 * Author: Damith Chandrathilaka (IT23168336)
 * Group: 42
 * Description: Interface defining contract for hashing and verifying passwords.
 * Individual Contribution: Implemented the password hasher interface.
 */

namespace SmartSolarMicrogridAPI.Common.Security;

public interface IPasswordHasher
{
    // Hashes a plain-text password with a random salt.
    string Hash(string password);

    // Checks a plain-text password against a stored hash.
    bool Verify(string password, string passwordHash);
}

/*
 * File: IPasswordHasher.cs
 * Author: Damith Chandrathilaka (IT23168336)
 * Group: 45
 * Description: Interface defining contract for hashing and verifying passwords.
 * Individual Contribution: Implemented the password hasher interface.
 */

namespace SmartSolarMicrogridAPI.Common.Security;

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string passwordHash);
}

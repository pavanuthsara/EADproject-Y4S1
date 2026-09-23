/*
 * File: PasswordHasher.cs
 * Author: Damith Chandrathilaka (IT23168336)
 * Group: 45
 * Description: Implementation of IPasswordHasher using PBKDF2 with SHA-256 and cryptographic salt.
 * Individual Contribution: Implemented password hashing and verification logic.
 */

using System.Security.Cryptography;

namespace SmartSolarMicrogridAPI.Common.Security;

public class PasswordHasher : IPasswordHasher
{
    private const int SaltSize = 16;
    private const int KeySize = 32;
    private const int Iterations = 100_000;
    private static readonly HashAlgorithmName Algorithm = HashAlgorithmName.SHA256;
    private const char SegmentDelimiter = '.';

    public string Hash(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(SaltSize);
        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, Algorithm, KeySize);

        return string.Join(SegmentDelimiter, Convert.ToBase64String(salt), Convert.ToBase64String(hash));
    }

    public bool Verify(string password, string passwordHash)
    {
        string[] segments = passwordHash.Split(SegmentDelimiter);
        if (segments.Length != 2)
        {
            return false;
        }

        byte[] salt = Convert.FromBase64String(segments[0]);
        byte[] hash = Convert.FromBase64String(segments[1]);

        byte[] checkHash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, Algorithm, KeySize);

        return CryptographicOperations.FixedTimeEquals(hash, checkHash);
    }
}

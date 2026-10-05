/*
 * File: PasswordHasher.cs
 * Author: Damith Chandrathilaka (IT23168336)
 * Group: 42
 * Description: Implementation of IPasswordHasher using PBKDF2 with SHA-256 and cryptographic salt.
 * Individual Contribution: Implemented password hashing and verification logic.
 */

using System.Security.Cryptography;

namespace SmartSolarMicrogridAPI.Common.Security;

public class PasswordHasher : IPasswordHasher
{
    private const int SaltSize = 16; //how many random bytes to generate for the salt (128 bits, a standard size).
    private const int KeySize = 32; //32 bytes (256 bits), a standard size for cryptographic hashes.
    private const int Iterations = 100_000; //number of times the hashing function is applied to the password. higher = more secure but slower.
    private static readonly HashAlgorithmName Algorithm = HashAlgorithmName.SHA256; //hashing algorithm to use (SHA-256, a standard cryptographic hash function).
    private const char SegmentDelimiter = '.'; //delimiter used to separate the salt and hash in the stored password.

    // Hashes a password with PBKDF2 and a random salt; stored as "salt.hash" in Base64.
    public string Hash(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(SaltSize);
        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, Algorithm, KeySize);

        return string.Join(SegmentDelimiter, Convert.ToBase64String(salt), Convert.ToBase64String(hash));
    }

    // Re-hashes the password with the stored salt and compares it to the stored hash.
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

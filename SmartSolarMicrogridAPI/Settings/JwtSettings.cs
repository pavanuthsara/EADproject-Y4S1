/*
 * File: JwtSettings.cs
 * Author: Damith Chandrathilaka (IT23168336)
 * Group: 42
 * Description: Strongly typed settings for JWT configuration.
 * Individual Contribution: Implemented JWT configuration settings.
 */

using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogridAPI.Settings;

public class JwtSettings
{
    public const string SectionName = "Jwt";

    [Required(ErrorMessage = "Jwt:SecretKey is required. Set Jwt__SecretKey in .env (at least 32 characters).")]
    [MinLength(32, ErrorMessage = "Jwt:SecretKey must be at least 32 characters (256 bits) to sign with HMAC-SHA256.")]
    public string SecretKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpirationHours { get; set; } = 24;
}

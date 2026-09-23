/*
 * File: JwtSettings.cs
 * Author: Damith Chandrathilaka (IT23168336)
 * Group: 45
 * Description: Strongly typed settings for JWT configuration.
 * Individual Contribution: Implemented JWT configuration settings.
 */

namespace SmartSolarMicrogridAPI.Settings;

public class JwtSettings
{
    public const string SectionName = "Jwt";
    public string SecretKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpirationHours { get; set; } = 24;
}

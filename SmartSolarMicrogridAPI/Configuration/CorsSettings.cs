/*
 * File: CorsSettings.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Strongly typed settings bound from the Cors configuration section.
 *
 * Individual Contribution: Implemented the typed settings class for the allowed CORS
 *                          origins.
 */

namespace SmartSolarMicrogridAPI.Configuration;

public class CorsSettings
{
    public const string SectionName = "Cors";

    public string[] AllowedOrigins { get; set; } = Array.Empty<string>();
}

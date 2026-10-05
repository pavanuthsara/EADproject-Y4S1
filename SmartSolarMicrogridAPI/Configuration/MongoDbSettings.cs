/*
 * File: MongoDbSettings.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 42
 * Description: Strongly typed settings bound from the MongoDbSettings configuration
 *              section.
 *
 * Individual Contribution: Implemented the typed MongoDB settings with startup
 *                          validation and clear error messages.
 */

using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogridAPI.Configuration;

public class MongoDbSettings
{
    public const string SectionName = "MongoDbSettings";

    [Required(ErrorMessage = "MongoDbSettings__ConnectionString is not set. Add it to .env (see .env.example) or use dotnet user-secrets.")]
    public string ConnectionString { get; set; } = string.Empty;

    [Required(ErrorMessage = "MongoDbSettings__DatabaseName is not set. It defaults from appsettings.json.")]
    public string DatabaseName { get; set; } = string.Empty;

    [Range(1, 60, ErrorMessage = "MongoDbSettings__PingTimeoutSeconds must be between 1 and 60.")]
    public int PingTimeoutSeconds { get; set; } = 5;
}

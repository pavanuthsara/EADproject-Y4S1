/*
 * File: MongoDbSettings.cs
 * Purpose: Strongly typed settings bound from the MongoDbSettings configuration section.
 */

namespace SmartSolarMicrogridAPI.Configuration;

public class MongoDbSettings
{
    public const string SectionName = "MongoDbSettings";
    public const string PlaceholderConnectionString = "REPLACE_VIA_USER_SECRETS";

    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = string.Empty;
    public int PingTimeoutSeconds { get; set; } = 5;
}

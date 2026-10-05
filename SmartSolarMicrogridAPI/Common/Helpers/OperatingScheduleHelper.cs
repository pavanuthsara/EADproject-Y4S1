/*
 * File: OperatingScheduleHelper.cs
 * Author: Ransilu Samaraweera
 * Group: 42
 * Description: Format and window checks for a station's daily operating schedule ("HH:mm-HH:mm").
 * Individual Contribution: Implemented the shared operating schedule format and window validation.
 */

using System.Globalization;

namespace SmartSolarMicrogridAPI.Common.Helpers;

public static class OperatingScheduleHelper
{
    // 24h "HH:mm-HH:mm", e.g. "06:00-18:00". Used by the request DTOs' [RegularExpression].
    public const string Pattern = @"^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$";

    public const string FormatErrorMessage = "Operating schedule must be in HH:mm-HH:mm (24-hour) format, e.g. 06:00-18:00.";

    // Checks that a well-formed schedule closes after it opens on the same day.
    public static bool HasValidWindow(string schedule)
    {
        string[] parts = schedule.Split('-');
        if (parts.Length != 2) return false;

        return TimeOnly.TryParseExact(parts[0], "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var start)
            && TimeOnly.TryParseExact(parts[1], "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var end)
            && end > start;
    }
}

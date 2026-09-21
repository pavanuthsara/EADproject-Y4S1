/*
 * File: DateTimeHelper.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Provides UTC date and time maths helpers with no business decisions.
 *
 * Individual Contribution: Implemented the UTC helpers, including the check that a
 *                          date-time is at least N hours in the future.
 */

namespace SmartSolarMicrogridAPI.Common.Helpers;

public static class DateTimeHelper
{
    public static DateTime UtcNow => DateTime.UtcNow;

    // Checks whether a date-time is at least the given number of hours after the current UTC time.
    public static bool IsAtLeastHoursInFuture(DateTime value, int hours)
    {
        var utcValue = value.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(value, DateTimeKind.Utc)
            : value.ToUniversalTime();

        return utcValue >= UtcNow.AddHours(hours);
    }
}

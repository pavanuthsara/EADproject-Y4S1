/*
 * File: BusinessRuleConstants.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Holds the numeric limits used by reservation business rules.
 *
 * Individual Contribution: Defined the advance-booking window and minimum-notice limits
 *                          used by reservation rules.
 */

namespace SmartSolarMicrogridAPI.Common.Constants;

public static class BusinessRuleConstants
{
    public const int MaxAdvanceBookingDays = 7;
    public const int MinimumNoticeHours = 12;
}

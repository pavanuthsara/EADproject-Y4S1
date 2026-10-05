/*
 * File: DashboardAnalyticsResponseDto.cs
 * Author: Pavan Uthsara (IT23158986)
 * Group: 42
 * Description: DTO for dashboard reservation counts.
 * Individual Contribution: Implemented DTO for analytics dashboard.
 */

namespace SmartSolarMicrogridAPI.DTOs.Responses;

public class DashboardAnalyticsResponseDto
{
    public long ActiveReservations { get; set; }
    public long PendingReservations { get; set; }
    public long ApprovedFutureReservations { get; set; }
}

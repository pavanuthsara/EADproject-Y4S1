/*
 * File: UserResponseDto.cs
 * Author: Pavan Uthsara (IT23158986)
 * Group: 42
 * Description: DTO for user data response.
 * Individual Contribution: Implemented the response DTO to standardize user data payload.
 */

namespace SmartSolarMicrogridAPI.DTOs.Responses;

public class UserResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Nic { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string AccountStatus { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public double SolarCapacityKw { get; set; }
    public DateTime CreatedAt { get; set; }
}

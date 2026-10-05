/*
 * File: AuthResponseDto.cs
 * Author: Damith Chandrathilaka (IT23168336)
 * Group: 45
 * Description: DTO for authentication responses returning JWT token and user details.
 * Individual Contribution: Implemented the authentication response DTO.
 */

namespace SmartSolarMicrogridAPI.DTOs.Responses;

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAtUtc { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Nic { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

/*
 * File: LoginRequestDto.cs
 * Author: Damith Chandrathilaka (IT23168336)
 * Group: 42
 * Description: DTO for user login requests.
 * Individual Contribution: Implemented the login request DTO with email and password fields.
 */

using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogridAPI.DTOs.Requests;

// Send either Email (any role) or Nic (prosumers only). When both are sent, Nic is used.
public class LoginRequestDto
{
    public string? Email { get; set; }

    public string? Nic { get; set; }

    [Required]
    public string Password { get; set; } = string.Empty;
}

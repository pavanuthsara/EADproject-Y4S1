/*
 * File: LoginRequestDto.cs
 * Author: Damith Chandrathilaka (IT23168336)
 * Group: 45
 * Description: DTO for user login requests.
 * Individual Contribution: Implemented the login request DTO with email and password fields.
 */

using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogridAPI.DTOs.Requests;

public class LoginRequestDto
{
[Required]
    public string Email { get; set; } = string.Empty;
[Required]
    public string Password { get; set; } = string.Empty;
}

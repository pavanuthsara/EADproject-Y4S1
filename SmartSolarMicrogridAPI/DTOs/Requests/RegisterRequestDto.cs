/*
 * File: RegisterRequestDto.cs
 * Group: 45
 * Description: DTO for user registration requests.
 */

using System.ComponentModel.DataAnnotations;
using SmartSolarMicrogridAPI.Common.Enums;

namespace SmartSolarMicrogridAPI.DTOs.Requests;

public class RegisterRequestDto
{
    [Required(ErrorMessage = "Role is required.")]
    public UserRole Role { get; set; }

    [Required(ErrorMessage = "NIC is required.")]
    [StringLength(12, MinimumLength = 10, ErrorMessage = "NIC must be 10–12 characters.")]
    public string Nic { get; set; } = string.Empty;

    [Required(ErrorMessage = "Full name is required.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Full name must be 2–100 characters.")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Invalid email format.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Phone number is required.")]
    [Phone(ErrorMessage = "Invalid phone number format.")]
    public string Phone { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "Password must be at least 8 characters.")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Address is required.")]
    [StringLength(250, ErrorMessage = "Address cannot exceed 250 characters.")]
    public string Address { get; set; } = string.Empty;

    [Range(0, 1000, ErrorMessage = "Solar capacity must be between 0 and 1000 kW.")]
    public double SolarCapacityKw { get; set; }
}

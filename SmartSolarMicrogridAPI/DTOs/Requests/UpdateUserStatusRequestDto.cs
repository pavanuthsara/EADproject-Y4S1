/*
 * File: UpdateUserStatusRequestDto.cs
 * Description: DTO for updating user status.
 */

using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogridAPI.DTOs.Requests;

public class UpdateUserStatusRequestDto
{
    [Required]
    public string Status { get; set; } = string.Empty;
}

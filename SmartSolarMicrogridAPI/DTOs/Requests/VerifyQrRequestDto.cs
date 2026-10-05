/*
 * File: VerifyQrRequestDto.cs
 * Author: Damith Chandrathilaka (IT23168336)
 * Group: 42
 * Description: DTO for validating scanned QR code tokens sent by the mobile app.
 * Individual Contribution: Implemented QR verification request data transfer object.
 */

using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogridAPI.DTOs.Requests;

public class VerifyQrRequestDto
{
    [Required(ErrorMessage = "QR token is required.")]
    public string QrToken { get; set; } = string.Empty;
}

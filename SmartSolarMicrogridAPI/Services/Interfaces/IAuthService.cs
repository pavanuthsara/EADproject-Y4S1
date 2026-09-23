/*
 * File: IAuthService.cs
 * Author: Damith Chandrathilaka (IT23168336)
 * Group: 45
 * Description: Contract for user registration and authentication operations.
 * Individual Contribution: Implemented the authentication service interface.
 */

using SmartSolarMicrogridAPI.DTOs.Requests;
using SmartSolarMicrogridAPI.DTOs.Responses;

namespace SmartSolarMicrogridAPI.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto);
    Task<AuthResponseDto> LoginAsync(LoginRequestDto dto);
}

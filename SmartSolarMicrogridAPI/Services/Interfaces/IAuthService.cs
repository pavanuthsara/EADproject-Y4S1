/*
 * File: IAuthService.cs
 * Author: Damith Chandrathilaka (IT23168336)
 * Group: 42
 * Description: Contract for user registration and authentication operations.
 * Individual Contribution: Implemented the authentication service interface.
 */

using SmartSolarMicrogridAPI.DTOs.Requests;
using SmartSolarMicrogridAPI.DTOs.Responses;

namespace SmartSolarMicrogridAPI.Services.Interfaces;

public interface IAuthService
{
    // Registers a new user account.
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto);

    // Checks the credentials and returns a JWT for the user.
    Task<AuthResponseDto> LoginAsync(LoginRequestDto dto);
}

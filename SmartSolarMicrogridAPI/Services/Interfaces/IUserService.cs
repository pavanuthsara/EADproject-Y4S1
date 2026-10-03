/*
 * File: IUserService.cs
 * Author: Pavan Uthsara (IT23158986)
 * Group: 45
 * Description: Interface for user management service.
 * Individual Contribution: Defined the user service interface for staff management.
 */

using SmartSolarMicrogridAPI.DTOs.Requests;
using SmartSolarMicrogridAPI.DTOs.Responses;

namespace SmartSolarMicrogridAPI.Services.Interfaces;

public interface IUserService
{
    Task<IEnumerable<UserResponseDto>> GetAllProsumersAsync();
    Task<IEnumerable<UserResponseDto>> GetAllStaffAsync();
    Task<UserResponseDto> CreateStaffAsync(CreateStaffRequestDto dto);
    Task<UserResponseDto> UpdateStaffProfileAsync(string id, UpdateStaffRequestDto dto);
    Task<UserResponseDto> UpdateStaffStatusAsync(string id, string status, string updatedBy);
    Task<UserResponseDto> CreateProsumerByBackofficeAsync(CreateProsumerRequestDto dto);
    Task<UserResponseDto> ActivateProsumerAsync(string nic, string activatedByUserId);
    Task<UserResponseDto> UpdateProsumerProfileAsync(string nic, UpdateProfileRequestDto dto);
    Task<UserResponseDto> DeactivateProsumerAsync(string nic, string deactivatedByUserId);
    Task<UserResponseDto?> GetProsumerStatusAsync(string identifier);
}

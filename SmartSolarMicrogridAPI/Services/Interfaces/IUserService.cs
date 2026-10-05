/*
 * File: IUserService.cs
 * Author: Pavan Uthsara (IT23158986)
 * Group: 42
 * Description: Interface for user management service.
 * Individual Contribution: Defined the user service interface for staff management.
 */

using SmartSolarMicrogridAPI.DTOs.Requests;
using SmartSolarMicrogridAPI.DTOs.Responses;

namespace SmartSolarMicrogridAPI.Services.Interfaces;

public interface IUserService
{
    // Returns every prosumer account.
    Task<IEnumerable<UserResponseDto>> GetAllProsumersAsync();

    // Returns every Backoffice and Grid Operator account.
    Task<IEnumerable<UserResponseDto>> GetAllStaffAsync();

    // Creates a Backoffice or Grid Operator account.
    Task<UserResponseDto> CreateStaffAsync(CreateStaffRequestDto dto);

    // Updates a staff member's profile details.
    Task<UserResponseDto> UpdateStaffProfileAsync(string id, UpdateStaffRequestDto dto);

    // Activates or deactivates a staff account.
    Task<UserResponseDto> UpdateStaffStatusAsync(string id, string status, string updatedBy);

    // Creates a prosumer account on behalf of the prosumer (Backoffice).
    Task<UserResponseDto> CreateProsumerByBackofficeAsync(CreateProsumerRequestDto dto);

    // Activates a pending or deactivated prosumer account.
    Task<UserResponseDto> ActivateProsumerAsync(string nic, string activatedByUserId);

    // Updates a prosumer's profile details.
    Task<UserResponseDto> UpdateProsumerProfileAsync(string nic, UpdateProfileRequestDto dto);

    // Deactivates a prosumer account.
    Task<UserResponseDto> DeactivateProsumerAsync(string nic, string deactivatedByUserId);

    // Looks up a prosumer by NIC or email; returns null if not found.
    Task<UserResponseDto?> GetProsumerStatusAsync(string identifier);
}

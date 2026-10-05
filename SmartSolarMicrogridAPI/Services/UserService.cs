/*
 * File: UserService.cs
 * Author: Pavan Uthsara (IT23158986)
 * Group: 45
 * Description: Implementation of user management business logic.
 * Individual Contribution: Implemented staff user creation logic including validation and database insertion.
 */

using SmartSolarMicrogridAPI.Common.Constants;
using SmartSolarMicrogridAPI.Common.Enums;
using SmartSolarMicrogridAPI.Common.Exceptions;
using SmartSolarMicrogridAPI.Common.Security;
using SmartSolarMicrogridAPI.DTOs.Requests;
using SmartSolarMicrogridAPI.DTOs.Responses;
using SmartSolarMicrogridAPI.Models.Entities;
using SmartSolarMicrogridAPI.Repositories.Interfaces;
using SmartSolarMicrogridAPI.Services.Interfaces;

namespace SmartSolarMicrogridAPI.Services;

public class UserService(
    IMongoRepository<User> userRepository,
    IPasswordHasher passwordHasher) : IUserService
{
    // Returns every prosumer account.
    public async Task<IEnumerable<UserResponseDto>> GetAllProsumersAsync()
    {
        var prosumers = await userRepository.FindAsync(u => u.Role == RoleConstants.Prosumer);
        return prosumers.Select(u => new UserResponseDto
        {
            Id = u.Id,
            Role = u.Role,
            Nic = u.Nic,
            FullName = u.FullName,
            Email = u.Email,
            Phone = u.Phone,
            AccountStatus = u.AccountStatus,
            CreatedAt = u.CreatedAt
        });
    }

    // Creates a Backoffice or Grid Operator account; the NIC and email must be unused.
    public async Task<UserResponseDto> CreateStaffAsync(CreateStaffRequestDto dto)
    {
        if (dto.Role != UserRole.Backoffice && dto.Role != UserRole.GridOperator)
            throw new BusinessRuleException("Only Backoffice and Grid Operator roles can be created via this endpoint.");

        bool userExists = await userRepository.ExistsAsync(u => u.Nic == dto.Nic || u.Email == dto.Email);
        if (userExists)
            throw new BusinessRuleException("A user with this NIC or email already exists.");

        var user = new User
        {
            Role = dto.Role.ToString(),
            Nic = dto.Nic,
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            PasswordHash = passwordHasher.Hash(dto.Password),
            AccountStatus = AccountStatus.Active.ToString(),
            Address = dto.Address,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await userRepository.CreateAsync(user);

        return new UserResponseDto
        {
            Id = created.Id,
            Role = created.Role,
            Nic = created.Nic,
            FullName = created.FullName,
            Email = created.Email,
            Phone = created.Phone,
            AccountStatus = created.AccountStatus,
            CreatedAt = created.CreatedAt
        };
    }

    // Returns every Backoffice and Grid Operator account.
    public async Task<IEnumerable<UserResponseDto>> GetAllStaffAsync()
    {
        var staffRoles = new[] { RoleConstants.Backoffice, RoleConstants.GridOperator };
        var staffUsers = await userRepository.FindAsync(u => staffRoles.Contains(u.Role));
        
        return staffUsers.Select(u => new UserResponseDto
        {
            Id = u.Id,
            Role = u.Role,
            Nic = u.Nic,
            FullName = u.FullName,
            Email = u.Email,
            Phone = u.Phone,
            AccountStatus = u.AccountStatus,
            CreatedAt = u.CreatedAt
        });
    }

    // Updates a staff member's profile details; refuses non-staff users.
    public async Task<UserResponseDto> UpdateStaffProfileAsync(string id, UpdateStaffRequestDto dto)
    {
        var users = await userRepository.FindAsync(u => u.Id == id);
        var user = users.FirstOrDefault();

        if (user == null)
            throw new NotFoundException($"Staff with ID {id} not found.");

        if (user.Role != RoleConstants.Backoffice && user.Role != RoleConstants.GridOperator)
            throw new BusinessRuleException("Cannot update a non-staff user via this endpoint.");

        // Check if new email is already taken by someone else
        if (user.Email != dto.Email)
        {
            bool emailExists = await userRepository.ExistsAsync(u => u.Email == dto.Email && u.Id != user.Id);
            if (emailExists)
                throw new BusinessRuleException("Email address is already in use by another account.");
        }

        user.FullName = dto.FullName;
        user.Email = dto.Email;
        user.Phone = dto.Phone ?? user.Phone;
        user.Address = dto.Address ?? user.Address;
        user.Role = dto.Role.ToString();
        user.UpdatedAt = DateTime.UtcNow;

        await userRepository.UpdateAsync(user.Id, user);

        return new UserResponseDto
        {
            Id = user.Id,
            Role = user.Role,
            Nic = user.Nic,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            AccountStatus = user.AccountStatus,
            CreatedAt = user.CreatedAt
        };
    }

    // Activates or deactivates a staff account; refuses non-staff users.
    public async Task<UserResponseDto> UpdateStaffStatusAsync(string id, string status, string updatedBy)
    {
        var users = await userRepository.FindAsync(u => u.Id == id);
        var user = users.FirstOrDefault();

        if (user == null)
            throw new NotFoundException($"Staff with ID {id} not found.");

        if (user.Role != RoleConstants.Backoffice && user.Role != RoleConstants.GridOperator)
            throw new BusinessRuleException("Cannot update a non-staff user via this endpoint.");

        user.AccountStatus = status;
        user.UpdatedAt = DateTime.UtcNow;

        if (status == AccountStatus.Deactivated.ToString())
        {
            user.DeactivatedBy = updatedBy;
            user.DeactivatedAt = DateTime.UtcNow;
        }
        else if (status == AccountStatus.Active.ToString())
        {
            user.ReactivatedBy = updatedBy;
            user.ReactivatedAt = DateTime.UtcNow;
        }

        await userRepository.UpdateAsync(user.Id, user);

        return new UserResponseDto
        {
            Id = user.Id,
            Role = user.Role,
            Nic = user.Nic,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            AccountStatus = user.AccountStatus,
            CreatedAt = user.CreatedAt
        };
    }

    // Creates a prosumer account on behalf of the prosumer; the NIC and email must be unused.
    public async Task<UserResponseDto> CreateProsumerByBackofficeAsync(CreateProsumerRequestDto dto)
    {
        bool userExists = await userRepository.ExistsAsync(u => u.Nic == dto.Nic || u.Email == dto.Email);
        if (userExists)
            throw new BusinessRuleException("A prosumer with this NIC or email already exists.");

        var user = new User
        {
            Role = RoleConstants.Prosumer,
            Nic = dto.Nic,
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            PasswordHash = passwordHasher.Hash(dto.Password),
            AccountStatus = AccountStatus.Active.ToString(), // Active immediately
            Address = dto.Address,
            SolarCapacityKw = dto.SolarCapacityKw,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await userRepository.CreateAsync(user);

        return new UserResponseDto
        {
            Id = created.Id,
            Role = created.Role,
            Nic = created.Nic,
            FullName = created.FullName,
            Email = created.Email,
            Phone = created.Phone,
            AccountStatus = created.AccountStatus,
            CreatedAt = created.CreatedAt
        };
    }

    // Activates a prosumer account that is not already active.
    public async Task<UserResponseDto> ActivateProsumerAsync(string nic, string activatedByUserId)
    {
        var users = await userRepository.FindAsync(u => u.Nic == nic && u.Role == RoleConstants.Prosumer);
        var user = users.FirstOrDefault();

        if (user == null)
            throw new NotFoundException($"Prosumer with NIC {nic} not found.");

        if (user.AccountStatus == AccountStatus.Active.ToString())
            throw new BusinessRuleException("This prosumer is already active.");

        if (user.AccountStatus == AccountStatus.Deactivated.ToString())
        {
            user.ReactivatedBy = activatedByUserId;
            user.ReactivatedAt = DateTime.UtcNow;
        }
        else
        {
            user.ActivatedBy = activatedByUserId;
            user.ActivatedAt = DateTime.UtcNow;
        }

        user.AccountStatus = AccountStatus.Active.ToString();
        user.UpdatedAt = DateTime.UtcNow;

        await userRepository.UpdateAsync(user.Id, user);

        return new UserResponseDto
        {
            Id = user.Id,
            Role = user.Role,
            Nic = user.Nic,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            AccountStatus = user.AccountStatus,
            CreatedAt = user.CreatedAt
        };
    }

    // Deactivates a prosumer account that is not already deactivated.
    public async Task<UserResponseDto> DeactivateProsumerAsync(string nic, string deactivatedByUserId)
    {
        var users = await userRepository.FindAsync(u => u.Nic == nic && u.Role == RoleConstants.Prosumer);
        var user = users.FirstOrDefault();

        if (user == null)
            throw new NotFoundException($"Prosumer with NIC {nic} not found.");

        if (user.AccountStatus == AccountStatus.Deactivated.ToString())
            throw new BusinessRuleException("This prosumer is already deactivated.");

        user.AccountStatus = AccountStatus.Deactivated.ToString();
        user.DeactivatedBy = deactivatedByUserId;
        user.DeactivatedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;

        await userRepository.UpdateAsync(user.Id, user);

        return new UserResponseDto
        {
            Id = user.Id,
            Role = user.Role,
            Nic = user.Nic,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            AccountStatus = user.AccountStatus,
            CreatedAt = user.CreatedAt
        };
    }

    // Updates a prosumer's profile; a new email must not belong to another user.
    public async Task<UserResponseDto> UpdateProsumerProfileAsync(string nic, UpdateProfileRequestDto dto)
    {
        var users = await userRepository.FindAsync(u => u.Nic == nic && u.Role == RoleConstants.Prosumer);
        var user = users.FirstOrDefault();

        if (user == null)
            throw new NotFoundException($"Prosumer with NIC {nic} not found.");

        // Check if new email is already taken by someone else
        if (user.Email != dto.Email)
        {
            bool emailExists = await userRepository.ExistsAsync(u => u.Email == dto.Email && u.Id != user.Id);
            if (emailExists)
                throw new BusinessRuleException("Email address is already in use by another account.");
        }

        user.FullName = dto.FullName;
        user.Email = dto.Email;
        user.Phone = dto.Phone;
        user.Address = dto.Address;
        user.SolarCapacityKw = dto.SolarCapacityKw;
        user.UpdatedAt = DateTime.UtcNow;

        await userRepository.UpdateAsync(user.Id, user);

        return new UserResponseDto
        {
            Id = user.Id,
            Role = user.Role,
            Nic = user.Nic,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            AccountStatus = user.AccountStatus,
            CreatedAt = user.CreatedAt
        };
    }

    // Looks up a prosumer by NIC or email; returns null if not found.
    public async Task<UserResponseDto?> GetProsumerStatusAsync(string identifier)
    {
        var users = await userRepository.FindAsync(u =>
            (u.Nic == identifier || u.Email == identifier) && u.Role == RoleConstants.Prosumer);
        var user = users.FirstOrDefault();
        if (user == null) return null;

        return new UserResponseDto
        {
            Id = user.Id,
            Role = user.Role,
            Nic = user.Nic,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            AccountStatus = user.AccountStatus,
            CreatedAt = user.CreatedAt
        };
    }
}

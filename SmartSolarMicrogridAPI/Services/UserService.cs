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

    public async Task<UserResponseDto> ActivateProsumerAsync(string nic, string activatedByUserId)
    {
        var users = await userRepository.FindAsync(u => u.Nic == nic && u.Role == RoleConstants.Prosumer);
        var user = users.FirstOrDefault();

        if (user == null)
            throw new NotFoundException($"Prosumer with NIC {nic} not found.");

        if (user.AccountStatus == AccountStatus.Active.ToString())
            throw new BusinessRuleException("This prosumer is already active.");

        user.AccountStatus = AccountStatus.Active.ToString();
        user.ActivatedBy = activatedByUserId;
        user.ActivatedAt = DateTime.UtcNow;
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
}

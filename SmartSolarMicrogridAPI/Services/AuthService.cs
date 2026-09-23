/*
 * File: AuthService.cs
 * Author: Damith Chandrathilaka (IT23168336)
 * Group: 45
 * Description: Handles user registration and login.
 * Individual Contribution: Implemented register and login logic.
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

public class AuthService : IAuthService
{
    private readonly IMongoRepository<User> _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public AuthService(
        IMongoRepository<User> userRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    // Registers a new user and returns a JWT token.
    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto)
    {
        bool userExists = await _userRepository.ExistsAsync(u => u.Nic == dto.Nic || u.Email == dto.Email);
        if (userExists)
            throw new BusinessRuleException("A user with this NIC or email already exists.");

        var user = new User
        {
            Role = RoleConstants.Prosumer,
            Nic = dto.Nic,
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            PasswordHash = _passwordHasher.Hash(dto.Password),
            AccountStatus = AccountStatus.Pending.ToString(),
            Address = dto.Address,
            SolarCapacityKw = dto.SolarCapacityKw,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _userRepository.CreateAsync(user);
        var (token, expires) = _jwtTokenGenerator.GenerateToken(created);

        return new AuthResponseDto
        {
            Token = token,
            ExpiresAtUtc = expires,
            UserId = created.Id,
            FullName = created.FullName,
            Email = created.Email,
            Role = created.Role
        };
    }

    // Validates credentials and returns a JWT token.
    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto dto)
    {
        var users = await _userRepository.FindAsync(u => u.Email == dto.Email);
        var user = users.FirstOrDefault();

        if (user == null || !_passwordHasher.Verify(dto.Password, user.PasswordHash))
            throw new BusinessRuleException("Invalid email or password.");

        if (user.AccountStatus == AccountStatus.Pending.ToString())
            throw new ForbiddenException("Your account is pending activation by an administrator.");

        if (user.AccountStatus == AccountStatus.Deactivated.ToString())
            throw new ForbiddenException("Account is deactivated.");

        var (token, expires) = _jwtTokenGenerator.GenerateToken(user);

        return new AuthResponseDto
        {
            Token = token,
            ExpiresAtUtc = expires,
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role
        };
    }
}

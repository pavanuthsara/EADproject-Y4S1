/*
 * File: AuthService.cs
 * Author: Damith Chandrathilaka (IT23168336)
 * Group: 42
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

    // Receives the user repository, password hasher and token generator.
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
        // A new prosumer is Pending until Backoffice approves it, so no token is issued. Signing in comes after approval.
        return new AuthResponseDto
        {
            Token = string.Empty,
            ExpiresAtUtc = DateTime.UtcNow,
            UserId = created.Id,
            Nic = created.Nic,
            FullName = created.FullName,
            Email = created.Email,
            Phone = created.Phone,
            Role = created.Role
        };
    }

    // Validates credentials and returns a JWT token. Any role can sign in by email; prosumers can also use their NIC.
    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto dto)
    {
        bool byNic = !string.IsNullOrWhiteSpace(dto.Nic);
        if (!byNic && string.IsNullOrWhiteSpace(dto.Email))
            throw new BusinessRuleException("Enter your email address or NIC.");

        var user = byNic
            ? await FindProsumerByNicAsync(dto.Nic!.Trim())
            : await FindByEmailAsync(dto.Email!.Trim());

        // The same message for an unknown account and a wrong password, so the response does not reveal which accounts exist.
        if (user == null || !_passwordHasher.Verify(dto.Password, user.PasswordHash))
            throw new BusinessRuleException(byNic ? "Invalid NIC or password." : "Invalid email or password.");

        if (user.AccountStatus == AccountStatus.Deactivated.ToString())
            throw new ForbiddenException("Account is deactivated.");

        // Checked after the password, so an unknown account and a wrong password still look the same.
        if (user.Role == RoleConstants.Prosumer && user.AccountStatus == AccountStatus.Pending.ToString())
            throw new ForbiddenException("Your account is waiting for backoffice approval. You can sign in once it is approved.");

        var (token, expires) = _jwtTokenGenerator.GenerateToken(user);

        return new AuthResponseDto
        {
            Token = token,
            ExpiresAtUtc = expires,
            UserId = user.Id,
            Nic = user.Nic,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            Role = user.Role
        };
    }

    // Finds a user of any role by email.
    private async Task<User?> FindByEmailAsync(string email)
    {
        var users = await _userRepository.FindAsync(u => u.Email == email);
        return users.FirstOrDefault();
    }

    // Finds a prosumer by NIC. Old-format NICs end in V, which may be typed in either case.
    private async Task<User?> FindProsumerByNicAsync(string nic)
    {
        string upper = nic.ToUpperInvariant();
        string lower = nic.ToLowerInvariant();

        var users = await _userRepository.FindAsync(u =>
            u.Role == RoleConstants.Prosumer && (u.Nic == nic || u.Nic == upper || u.Nic == lower));
        return users.FirstOrDefault();
    }
}

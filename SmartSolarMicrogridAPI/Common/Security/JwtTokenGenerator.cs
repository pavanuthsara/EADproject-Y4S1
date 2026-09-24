/*
 * File: JwtTokenGenerator.cs
 * Author: Damith Chandrathilaka (IT23168336)
 * Group: 45
 * Description: Implementation of IJwtTokenGenerator using HMAC-SHA256 signed JWT tokens.
 * Individual Contribution: Implemented JWT token generation logic.
 */

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SmartSolarMicrogridAPI.Models.Entities;
using SmartSolarMicrogridAPI.Settings;

namespace SmartSolarMicrogridAPI.Common.Security;

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly JwtSettings _jwtSettings;

    public JwtTokenGenerator(IOptions<JwtSettings> jwtOptions)
    {
        _jwtSettings = jwtOptions.Value;
    }

    public (string Token, DateTime ExpiresAtUtc) GenerateToken(User user)
    {
        // 1. Claims: payload facts stored in the token
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("nic", user.Nic)
        };

        // 2. Signing Key & Credentials
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        // 3. Expiry timestamp (UTC)
        var expiresAtUtc = DateTime.UtcNow.AddHours(_jwtSettings.ExpirationHours);

        // 4. Build and serialize the token
        var token = new JwtSecurityToken(
            issuer: string.IsNullOrWhiteSpace(_jwtSettings.Issuer) ? null : _jwtSettings.Issuer,
            audience: string.IsNullOrWhiteSpace(_jwtSettings.Audience) ? null : _jwtSettings.Audience,
            claims: claims,
            expires: expiresAtUtc,
            signingCredentials: credentials);

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return (tokenString, expiresAtUtc);
    }
}

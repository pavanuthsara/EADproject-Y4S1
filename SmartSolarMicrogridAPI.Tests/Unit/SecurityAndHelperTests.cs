using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Options;
using SmartSolarMicrogridAPI.Common.Helpers;
using SmartSolarMicrogridAPI.Common.Security;
using SmartSolarMicrogridAPI.Models.Entities;
using SmartSolarMicrogridAPI.Settings;
using Xunit;

namespace SmartSolarMicrogridAPI.Tests.Unit;

public sealed class SecurityAndHelperTests
{
    [Fact]
    public void PasswordHasherVerifiesOnlyTheOriginalPassword()
    {
        var hasher = new PasswordHasher();
        var hash = hasher.Hash("CorrectPassword123!");

        Assert.True(hasher.Verify("CorrectPassword123!", hash));
        Assert.False(hasher.Verify("WrongPassword123!", hash));
    }

    [Fact]
    public void JwtTokenGeneratorIncludesIdentityAndRoleClaims()
    {
        var generator = new JwtTokenGenerator(Options.Create(new JwtSettings
        {
            SecretKey = "test-only-secret-key-that-is-at-least-32-characters",
            Issuer = "tests",
            Audience = "tests",
            ExpirationHours = 1
        }));
        var user = new User
        {
            Id = "user-id",
            Email = "user@example.com",
            FullName = "Test User",
            Role = "Backoffice",
            Nic = "123456789V"
        };

        var result = generator.GenerateToken(user);
        var claims = new JwtSecurityTokenHandler().ReadJwtToken(result.Token).Claims.ToList();

        Assert.Equal("user-id", claims.Single(x => x.Type == ClaimTypes.NameIdentifier).Value);
        Assert.Equal("Backoffice", claims.Single(x => x.Type == ClaimTypes.Role).Value);
        Assert.Equal("tests", claims.Single(x => x.Type == JwtRegisteredClaimNames.Iss).Value);
    }

    [Fact]
    public void OperatingScheduleHelperRejectsOvernightWindow()
    {
        Assert.False(OperatingScheduleHelper.HasValidWindow("18:00-06:00"));
        Assert.True(OperatingScheduleHelper.HasValidWindow("06:00-18:00"));
    }
}

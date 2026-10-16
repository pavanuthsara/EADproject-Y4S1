using Moq;
using SmartSolarMicrogridAPI.Common.Enums;
using SmartSolarMicrogridAPI.Common.Exceptions;
using SmartSolarMicrogridAPI.Common.Security;
using SmartSolarMicrogridAPI.DTOs.Requests;
using SmartSolarMicrogridAPI.Models.Entities;
using SmartSolarMicrogridAPI.Repositories.Interfaces;
using SmartSolarMicrogridAPI.Services;
using Xunit;

namespace SmartSolarMicrogridAPI.Tests.Unit;

public sealed class AuthServiceTests
{
    [Fact]
    public async Task LoginAsyncWithoutEmailOrNicThrowsBusinessRuleException()
    {
        var repository = new Mock<IMongoRepository<User>>();
        var service = new AuthService(repository.Object, Mock.Of<IPasswordHasher>(), Mock.Of<IJwtTokenGenerator>());

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.LoginAsync(new LoginRequestDto { Password = "password" }));

        repository.Verify(x => x.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>()), Times.Never);
    }

    [Fact]
    public async Task LoginAsyncWithWrongPasswordThrowsBusinessRuleException()
    {
        var repository = new Mock<IMongoRepository<User>>();
        repository.Setup(x => x.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>()))
            .ReturnsAsync(new[] { new User { Email = "user@example.com", PasswordHash = "stored-hash" } });
        var hasher = new Mock<IPasswordHasher>();
        hasher.Setup(x => x.Verify("wrong-password", "stored-hash")).Returns(false);
        var service = new AuthService(repository.Object, hasher.Object, Mock.Of<IJwtTokenGenerator>());

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.LoginAsync(new LoginRequestDto
            {
                Email = "user@example.com",
                Password = "wrong-password"
            }));
    }

    [Fact]
    public async Task RegisterAsyncWithExistingUserThrowsBusinessRuleException()
    {
        var repository = new Mock<IMongoRepository<User>>();
        repository.Setup(x => x.ExistsAsync(It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>()))
            .ReturnsAsync(true);
        var service = new AuthService(repository.Object, Mock.Of<IPasswordHasher>(), Mock.Of<IJwtTokenGenerator>());

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.RegisterAsync(new RegisterRequestDto
            {
                Nic = "123456789V",
                Email = "user@example.com",
                FullName = "Test User",
                Phone = "0771234567",
                Password = "Password123!",
                Address = "Colombo"
            }));

        repository.Verify(x => x.CreateAsync(It.IsAny<User>()), Times.Never);
    }
}

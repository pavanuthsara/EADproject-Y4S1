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

public sealed class UserServiceTests
{
    [Fact]
    public async Task CreateStaffAsyncWithProsumerRoleThrowsBusinessRuleException()
    {
        var repository = new Mock<IMongoRepository<User>>();
        var service = new UserService(repository.Object, Mock.Of<IPasswordHasher>());

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.CreateStaffAsync(new CreateStaffRequestDto
            {
                Role = UserRole.Prosumer,
                Nic = "123456789V",
                FullName = "Test User",
                Email = "user@example.com",
                Phone = "0771234567",
                Password = "Password123!",
                Address = "Colombo"
            }));

        repository.Verify(x => x.ExistsAsync(It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>()), Times.Never);
    }

    [Fact]
    public async Task CreateStaffAsyncWithExistingUserThrowsBusinessRuleException()
    {
        var repository = new Mock<IMongoRepository<User>>();
        repository.Setup(x => x.ExistsAsync(It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>()))
            .ReturnsAsync(true);
        var service = new UserService(repository.Object, Mock.Of<IPasswordHasher>());

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.CreateStaffAsync(new CreateStaffRequestDto
            {
                Role = UserRole.Backoffice,
                Nic = "123456789V",
                FullName = "Test User",
                Email = "user@example.com",
                Phone = "0771234567",
                Password = "Password123!",
                Address = "Colombo"
            }));

        repository.Verify(x => x.CreateAsync(It.IsAny<User>()), Times.Never);
    }
}

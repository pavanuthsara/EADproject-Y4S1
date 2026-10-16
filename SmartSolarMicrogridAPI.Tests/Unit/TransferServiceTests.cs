using Moq;
using SmartSolarMicrogridAPI.Common.Enums;
using SmartSolarMicrogridAPI.Common.Exceptions;
using SmartSolarMicrogridAPI.DTOs.Requests;
using SmartSolarMicrogridAPI.Models.Entities;
using SmartSolarMicrogridAPI.Repositories.Interfaces;
using SmartSolarMicrogridAPI.Services;
using Xunit;

namespace SmartSolarMicrogridAPI.Tests.Unit;

public sealed class TransferServiceTests
{
    [Fact]
    public async Task VerifyQrAsyncWithUnknownTokenThrowsNotFoundException()
    {
        var repository = new Mock<IMongoRepository<EnergyReservation>>();
        repository.Setup(x => x.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<EnergyReservation, bool>>>()))
            .ReturnsAsync(Array.Empty<EnergyReservation>());
        var service = new TransferService(repository.Object);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.VerifyQrAsync(new VerifyQrRequestDto { QrToken = "unknown-token" }));
    }

    [Fact]
    public async Task VerifyQrAsyncForNonApprovedReservationThrowsBusinessRuleException()
    {
        var repository = new Mock<IMongoRepository<EnergyReservation>>();
        repository.Setup(x => x.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<EnergyReservation, bool>>>()))
            .ReturnsAsync(new[]
            {
                new EnergyReservation
                {
                    Id = "reservation-id",
                    QrToken = "qr-token",
                    Status = ReservationStatus.Pending.ToString()
                }
            });
        var service = new TransferService(repository.Object);

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.VerifyQrAsync(new VerifyQrRequestDto { QrToken = "qr-token" }));
    }
}

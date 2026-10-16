using Microsoft.Extensions.Options;
using Moq;
using SmartSolarMicrogridAPI.Common.Enums;
using SmartSolarMicrogridAPI.Common.Exceptions;
using SmartSolarMicrogridAPI.Configuration;
using SmartSolarMicrogridAPI.DTOs.Requests;
using SmartSolarMicrogridAPI.Models.Entities;
using SmartSolarMicrogridAPI.Repositories.Interfaces;
using SmartSolarMicrogridAPI.Services;
using Xunit;

namespace SmartSolarMicrogridAPI.Tests.Unit;

public sealed class ReservationServiceTests
{
    [Fact]
    public async Task UpdateAsyncWithoutChangesThrowsBusinessRuleException()
    {
        var reservationRepository = new Mock<IEnergyReservationRepository>();
        var service = CreateService(reservationRepository: reservationRepository);

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.UpdateAsync("reservation-id", new UpdateReservationRequest(), "prosumer-id"));

        reservationRepository.Verify(x => x.GetByIdAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task ApproveAsyncForAlreadyApprovedReservationThrowsConflictException()
    {
        var reservationRepository = new Mock<IEnergyReservationRepository>();
        reservationRepository.Setup(x => x.GetByIdAsync("reservation-id"))
            .ReturnsAsync(new EnergyReservation
            {
                Id = "reservation-id",
                Status = ReservationStatus.Approved.ToString()
            });
        var service = CreateService(reservationRepository: reservationRepository);

        await Assert.ThrowsAsync<ConflictException>(() =>
            service.ApproveAsync("reservation-id", "staff-id"));

        reservationRepository.Verify(x => x.TryReplaceAsync(It.IsAny<EnergyReservation>()), Times.Never);
    }

    private static ReservationService CreateService(
        Mock<IEnergyReservationRepository>? reservationRepository = null)
    {
        return new ReservationService(
            Mock.Of<ISolarStationRepository>(),
            Mock.Of<IEnergyBookingSlotRepository>(),
            (reservationRepository ?? new Mock<IEnergyReservationRepository>()).Object,
            Options.Create(new ReservationPolicyOptions
            {
                BookingWindowDays = 7,
                MinimumNoticeHours = 12
            }),
            TimeProvider.System);
    }
}

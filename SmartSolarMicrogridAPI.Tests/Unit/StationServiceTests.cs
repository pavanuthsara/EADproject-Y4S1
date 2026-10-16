using Moq;
using SmartSolarMicrogridAPI.Common.Exceptions;
using SmartSolarMicrogridAPI.DTOs.Requests;
using SmartSolarMicrogridAPI.Models.Entities;
using SmartSolarMicrogridAPI.Repositories.Interfaces;
using SmartSolarMicrogridAPI.Services;
using Xunit;

namespace SmartSolarMicrogridAPI.Tests.Unit;

public sealed class StationServiceTests
{
    [Fact]
    public async Task CreateStationAsyncWithInvalidOperatingWindowThrowsBusinessRuleException()
    {
        var stationRepository = new Mock<IMongoRepository<SolarStation>>();
        var service = new StationService(
            stationRepository.Object,
            Mock.Of<IMongoRepository<EnergyReservation>>(),
            Mock.Of<ISolarStationRepository>());

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.CreateStationAsync(new CreateStationRequestDto
            {
                StationName = "Central Station",
                StationCode = "CEN-01",
                Latitude = 6.9271,
                Longitude = 79.8612,
                AddressLine = "Main Road",
                City = "Colombo",
                CapacityKwh = 100,
                TotalBays = 2,
                OperatingSchedule = "18:00-06:00"
            }, "staff-id"));

        stationRepository.Verify(x => x.ExistsAsync(It.IsAny<System.Linq.Expressions.Expression<Func<SolarStation, bool>>>()), Times.Never);
    }

    [Fact]
    public async Task CreateStationAsyncWithDuplicateCodeThrowsBusinessRuleException()
    {
        var stationRepository = new Mock<IMongoRepository<SolarStation>>();
        stationRepository.Setup(x => x.ExistsAsync(It.IsAny<System.Linq.Expressions.Expression<Func<SolarStation, bool>>>()))
            .ReturnsAsync(true);
        var service = new StationService(
            stationRepository.Object,
            Mock.Of<IMongoRepository<EnergyReservation>>(),
            Mock.Of<ISolarStationRepository>());

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            service.CreateStationAsync(new CreateStationRequestDto
            {
                StationName = "Central Station",
                StationCode = "cen-01",
                Latitude = 6.9271,
                Longitude = 79.8612,
                AddressLine = "Main Road",
                City = "Colombo",
                CapacityKwh = 100,
                TotalBays = 2,
                OperatingSchedule = "06:00-18:00"
            }, "staff-id"));

        stationRepository.Verify(x => x.CreateAsync(It.IsAny<SolarStation>()), Times.Never);
    }
}

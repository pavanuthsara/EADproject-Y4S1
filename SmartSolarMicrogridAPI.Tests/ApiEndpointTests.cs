using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace SmartSolarMicrogridAPI.Tests;

public sealed class ApiEndpointTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Theory]
    [InlineData("GET", "/api/stations")]
    [InlineData("GET", "/api/stations/unknown-station/slots")]
    [InlineData("GET", "/api/reservations/policy")]
    [InlineData("POST", "/api/reservations")]
    [InlineData("GET", "/api/prosumer/profile")]
    [InlineData("GET", "/api/backoffice/prosumers")]
    [InlineData("GET", "/api/users/staff")]
    [InlineData("POST", "/api/transfers/verify")]
    public async Task ProtectedEndpointsWithoutTokenReturnUnauthorized(string method, string path)
    {
        using var request = new HttpRequestMessage(new HttpMethod(method), path);

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task LoginWithEmptyRequestReturnsBadRequest()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new { });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task RegisterWithEmptyRequestReturnsBadRequest()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register", new { });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ProsumerRegistrationWithEmptyRequestReturnsBadRequest()
    {
        var response = await _client.PostAsJsonAsync("/api/prosumer/register", new { });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UnknownEndpointReturnsNotFound()
    {
        var response = await _client.GetAsync("/api/does-not-exist");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}

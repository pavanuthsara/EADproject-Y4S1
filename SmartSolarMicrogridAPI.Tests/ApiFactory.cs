using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace SmartSolarMicrogridAPI.Tests;

public sealed class ApiFactory : WebApplicationFactory<Program>
{
    public ApiFactory()
    {
        Environment.SetEnvironmentVariable("Testing__SkipMongoInitialization", "true");
        Environment.SetEnvironmentVariable("MongoDbSettings__ConnectionString", "mongodb://localhost:27017");
        Environment.SetEnvironmentVariable("Jwt__SecretKey", "test-only-secret-key-that-is-at-least-32-characters");
        Environment.SetEnvironmentVariable("Jwt__Issuer", "SmartSolarMicrogridAPI.Tests");
        Environment.SetEnvironmentVariable("Jwt__Audience", "SmartSolarMicrogridAPI.Tests");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Testing:SkipMongoInitialization"] = "true",
                ["MongoDbSettings:ConnectionString"] = "mongodb://localhost:27017",
                ["Jwt:SecretKey"] = "test-only-secret-key-that-is-at-least-32-characters",
                ["Jwt:Issuer"] = "SmartSolarMicrogridAPI.Tests",
                ["Jwt:Audience"] = "SmartSolarMicrogridAPI.Tests"
            });
        });
    }
}

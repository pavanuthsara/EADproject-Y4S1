/*
 * File: Program.cs
 * Purpose: Configures dependency injection, middleware and startup tasks for the API.
 */

using Microsoft.Extensions.Options;
using MongoDB.Driver;
using SmartSolarMicrogridAPI.Configuration;
using SmartSolarMicrogridAPI.Data;
using SmartSolarMicrogridAPI.Middleware;
using SmartSolarMicrogridAPI.Repositories;
using SmartSolarMicrogridAPI.Repositories.Interfaces;
using SmartSolarMicrogridAPI.Services;
using SmartSolarMicrogridAPI.Services.Interfaces;

const string ClientAppsPolicy = "ClientApps";

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<MongoDbSettings>(builder.Configuration.GetSection(MongoDbSettings.SectionName));

builder.Services.AddSingleton<IMongoClient>(sp =>
{
    var settings = sp.GetRequiredService<IOptions<MongoDbSettings>>().Value;

    if (string.IsNullOrWhiteSpace(settings.ConnectionString)
        || settings.ConnectionString == MongoDbSettings.PlaceholderConnectionString)
    {
        throw new InvalidOperationException(
            "MongoDbSettings:ConnectionString is not configured. Set it with dotnet user-secrets.");
    }

    return new MongoClient(settings.ConnectionString);
});
builder.Services.AddSingleton<MongoDbContext>();

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ISolarStationRepository, SolarStationRepository>();
builder.Services.AddScoped<IEnergyBookingSlotRepository, EnergyBookingSlotRepository>();
builder.Services.AddScoped<IEnergyReservationRepository, EnergyReservationRepository>();

builder.Services.AddScoped<IHealthService, HealthService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy(ClientAppsPolicy, policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.AllowAnyOrigin();
        }
        else
        {
            policy.WithOrigins("http://localhost:3000", "http://localhost:5173");
        }

        policy.AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseCors(ClientAppsPolicy);
app.MapControllers();

await app.Services.GetRequiredService<MongoDbContext>().CreateIndexesAsync();

app.Run();

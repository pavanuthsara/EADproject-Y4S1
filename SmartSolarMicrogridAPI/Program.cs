/*
 * File: Program.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Composes the API's services and request pipeline and runs startup tasks.
 *
 * Individual Contribution: Implemented the service composition, request pipeline and
 *                          startup sequence.
 */

using SmartSolarMicrogridAPI.Configuration;
using SmartSolarMicrogridAPI.Middleware;

DotEnvLoader.Load();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddMongoDb(builder.Configuration);
builder.Services.AddJwtAuth(builder.Configuration);
builder.Services.AddServices();
builder.Services.AddReservations(builder.Configuration);
builder.Services.AddClientAppsCors(builder.Configuration, builder.Environment);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseClientAppsCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

await app.InitializeMongoDbAsync();

app.Run();

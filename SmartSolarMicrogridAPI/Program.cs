/*
 * File: Program.cs
 * Purpose: Composes the API's services and request pipeline and runs startup tasks.
 */

using SmartSolarMicrogridAPI.Configuration;
using SmartSolarMicrogridAPI.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddMongoDb(builder.Configuration);
builder.Services.AddServices();
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
app.MapControllers();

await app.InitializeMongoDbAsync();

app.Run();

/*
 * File: MongoDbContext.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 42
 * Description: Exposes the MongoDB database and typed collections, and creates required
 *              indexes.
 *
 * Individual Contribution: Implemented the database context, connection ping and index
 *                          creation.
 */

using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using SmartSolarMicrogridAPI.Common.Constants;
using SmartSolarMicrogridAPI.Configuration;
using SmartSolarMicrogridAPI.Models.Entities;

namespace SmartSolarMicrogridAPI.Data;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public string DatabaseName { get; }
    public IMongoCollection<User> Users { get; }
    public IMongoCollection<SolarStation> SolarStations { get; }
    public IMongoCollection<EnergyBookingSlot> EnergyBookingSlots { get; }
    public IMongoCollection<EnergyReservation> EnergyReservations { get; }

    // Creates the database handle and the four typed collections from the configured settings.
    public MongoDbContext(IMongoClient client, IOptions<MongoDbSettings> options)
    {
        DatabaseName = options.Value.DatabaseName;
        _database = client.GetDatabase(DatabaseName);

        Users = _database.GetCollection<User>(CollectionNames.Users);
        SolarStations = _database.GetCollection<SolarStation>(CollectionNames.SolarStations);
        EnergyBookingSlots = _database.GetCollection<EnergyBookingSlot>(CollectionNames.EnergyBookingSlots);
        EnergyReservations = _database.GetCollection<EnergyReservation>(CollectionNames.EnergyReservations);
    }

    // Sends a ping command to the database to confirm the connection is alive.
    public async Task PingAsync(CancellationToken cancellationToken = default)
    {
        var command = new BsonDocumentCommand<BsonDocument>(new BsonDocument("ping", 1));
        await _database.RunCommandAsync(command, cancellationToken: cancellationToken);
    }

    // Creates the unique and geospatial indexes required by the collections.
    public async Task CreateIndexesAsync()
    {
        var unique = new CreateIndexOptions { Unique = true };

        await Users.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<User>(Builders<User>.IndexKeys.Ascending(u => u.Nic), unique),
            new CreateIndexModel<User>(Builders<User>.IndexKeys.Ascending(u => u.Email), unique)
        });

        await SolarStations.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<SolarStation>(Builders<SolarStation>.IndexKeys.Ascending(s => s.StationCode), unique),
            new CreateIndexModel<SolarStation>(Builders<SolarStation>.IndexKeys.Geo2DSphere(s => s.Location))
        });

        await EnergyReservations.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<EnergyReservation>(Builders<EnergyReservation>.IndexKeys.Ascending(r => r.ReservationNo), unique),
            new CreateIndexModel<EnergyReservation>(Builders<EnergyReservation>.IndexKeys.Ascending(r => r.QrToken), unique)
        });
    }
}

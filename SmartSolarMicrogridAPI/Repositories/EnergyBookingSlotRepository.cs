/*
 * File: EnergyBookingSlotRepository.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 42
 * Description: MongoDB data access for the energyBookingSlots collection, including a
 *              single atomic conditional update for the reserved capacity counters.
 *
 * Individual Contribution: Implemented the atomic capacity adjustment that prevents two
 *                          simultaneous bookings from overselling a slot.
 */

using MongoDB.Bson;
using MongoDB.Driver;
using SmartSolarMicrogridAPI.Common.Enums;
using SmartSolarMicrogridAPI.Data;
using SmartSolarMicrogridAPI.Models.Entities;
using SmartSolarMicrogridAPI.Repositories.Interfaces;

namespace SmartSolarMicrogridAPI.Repositories;

public class EnergyBookingSlotRepository(MongoDbContext context)
    : MongoRepository<EnergyBookingSlot>(context.EnergyBookingSlots), IEnergyBookingSlotRepository
{
    // Adds the deltas to both counters in one atomic update, matching only if increases stay within the slot's limits.
    public async Task<EnergyBookingSlot?> TryAdjustReservedCapacityAsync(string slotId, int positionsDelta, double kwhDelta)
    {
        if (!ObjectId.TryParse(slotId, out var objectId))
        {
            return null;
        }

        var newPositions = Add(FieldOrZero("reservedPositions"), positionsDelta);
        var newKwh = Add(FieldOrZero("reservedKwh"), kwhDelta);

        var limits = new BsonArray();
        if (positionsDelta > 0)
        {
            limits.Add(new BsonDocument("$lte", new BsonArray { newPositions, FieldOrZero("totalPositions") }));
        }

        if (kwhDelta > 0)
        {
            limits.Add(new BsonDocument("$lte", new BsonArray { newKwh, FieldOrZero("capacityKwh") }));
        }

        var filter = new BsonDocument("_id", objectId);
        if (limits.Count > 0)
        {
            filter.Add("$expr", new BsonDocument("$and", limits));
        }

        var setStage = new BsonDocument("$set", new BsonDocument
        {
            { "reservedPositions", new BsonDocument("$max", new BsonArray { 0, newPositions }) },
            { "reservedKwh", new BsonDocument("$max", new BsonArray { 0.0, newKwh }) },
            { "updatedAt", "$$NOW" }
        });

        var update = Builders<EnergyBookingSlot>.Update.Pipeline(
            PipelineDefinition<EnergyBookingSlot, EnergyBookingSlot>.Create(new[] { setStage }));

        return await Collection.FindOneAndUpdateAsync(
            new BsonDocumentFilterDefinition<EnergyBookingSlot>(filter),
            update,
            new FindOneAndUpdateOptions<EnergyBookingSlot> { ReturnDocument = ReturnDocument.After });
    }

    // Sets the status only when the stored status and counters are still the ones observed, so a stale write cannot win.
    public async Task<bool> TryUpdateStatusAsync(EnergyBookingSlot observedSlot, SlotStatus newStatus)
    {
        var filter = Builders<EnergyBookingSlot>.Filter.Eq(s => s.Id, observedSlot.Id)
            & Builders<EnergyBookingSlot>.Filter.Eq(s => s.Status, observedSlot.Status)
            & Builders<EnergyBookingSlot>.Filter.Eq(s => s.ReservedPositions, observedSlot.ReservedPositions)
            & Builders<EnergyBookingSlot>.Filter.Eq(s => s.ReservedKwh, observedSlot.ReservedKwh);

        var update = Builders<EnergyBookingSlot>.Update
            .Set(s => s.Status, newStatus.ToString())
            .Set(s => s.UpdatedAt, DateTime.UtcNow);

        var result = await Collection.UpdateOneAsync(filter, update);
        return result.ModifiedCount > 0;
    }

    // Returns every slot of a station, earliest first.
    public async Task<IReadOnlyList<EnergyBookingSlot>> FindByStationAsync(string stationId)
    {
        return await Collection.Find(s => s.StationId == stationId).SortBy(s => s.StartTime).ToListAsync();
    }

    // Reports whether another slot at the station overlaps the time window.
    public async Task<bool> HasOverlapAsync(string stationId, DateTime startUtc, DateTime endUtc, string? excludeSlotId)
    {
        var filter = Builders<EnergyBookingSlot>.Filter.Eq(s => s.StationId, stationId)
            & Builders<EnergyBookingSlot>.Filter.Lt(s => s.StartTime, endUtc)
            & Builders<EnergyBookingSlot>.Filter.Gt(s => s.EndTime, startUtc);

        if (excludeSlotId != null)
        {
            filter &= Builders<EnergyBookingSlot>.Filter.Ne(s => s.Id, excludeSlotId);
        }

        return await Collection.Find(filter).Limit(1).AnyAsync();
    }

    // Replaces the slot's details in one conditional update, so a booking made at the same moment cannot be lost.
    public async Task<EnergyBookingSlot?> TryUpdateDetailsAsync(
        string slotId, DateTime startUtc, DateTime endUtc, int totalPositions, double capacityKwh,
        IReadOnlyList<string> supportedDirections, bool timeWindowChanging)
    {
        if (!ObjectId.TryParse(slotId, out var objectId))
        {
            return null;
        }

        var reservedPositions = FieldOrZero("reservedPositions");
        var reservedKwh = FieldOrZero("reservedKwh");

        var conditions = new BsonArray
        {
            new BsonDocument("$lte", new BsonArray { reservedPositions, totalPositions }),
            new BsonDocument("$lte", new BsonArray { reservedKwh, capacityKwh })
        };

        if (timeWindowChanging)
        {
            conditions.Add(new BsonDocument("$eq", new BsonArray { reservedPositions, 0 }));
        }

        var filter = new BsonDocument { { "_id", objectId }, { "$expr", new BsonDocument("$and", conditions) } };

        var setStage = new BsonDocument("$set", new BsonDocument
        {
            { "startTime", new BsonDateTime(startUtc) },
            { "endTime", new BsonDateTime(endUtc) },
            { "totalPositions", totalPositions },
            { "capacityKwh", capacityKwh },
            { "supportedDirections", new BsonArray(supportedDirections) },
            { "status", OpenStatusExpression(totalPositions, capacityKwh) },
            { "updatedAt", "$$NOW" }
        });

        return await UpdateWithPipelineAsync(filter, setStage);
    }

    // Closes the slot, or reopens it as Available or Full depending on its current counters.
    public async Task<EnergyBookingSlot?> TrySetOpenAsync(string slotId, bool open)
    {
        if (!ObjectId.TryParse(slotId, out var objectId))
        {
            return null;
        }

        BsonValue status = open
            ? FullOrAvailableExpression(FieldOrZero("totalPositions"), FieldOrZero("capacityKwh"))
            : new BsonString(SlotStatus.Closed.ToString());

        var setStage = new BsonDocument("$set", new BsonDocument
        {
            { "status", status },
            { "updatedAt", "$$NOW" }
        });

        return await UpdateWithPipelineAsync(new BsonDocument("_id", objectId), setStage);
    }

    // Deletes the slot only while no position is reserved on it.
    public async Task<bool> TryDeleteUnreservedAsync(string slotId)
    {
        if (!ObjectId.TryParse(slotId, out var objectId))
        {
            return false;
        }

        var filter = new BsonDocument
        {
            { "_id", objectId },
            { "$expr", new BsonDocument("$eq", new BsonArray { FieldOrZero("reservedPositions"), 0 }) }
        };

        var result = await Collection.DeleteOneAsync(new BsonDocumentFilterDefinition<EnergyBookingSlot>(filter));
        return result.DeletedCount > 0;
    }

    // Runs a single-stage pipeline update and returns the document as it is afterwards.
    private async Task<EnergyBookingSlot?> UpdateWithPipelineAsync(BsonDocument filter, BsonDocument setStage)
    {
        var update = Builders<EnergyBookingSlot>.Update.Pipeline(
            PipelineDefinition<EnergyBookingSlot, EnergyBookingSlot>.Create(new[] { setStage }));

        return await Collection.FindOneAndUpdateAsync(
            new BsonDocumentFilterDefinition<EnergyBookingSlot>(filter),
            update,
            new FindOneAndUpdateOptions<EnergyBookingSlot> { ReturnDocument = ReturnDocument.After });
    }

    // Builds the status for a slot that is not closed: Full when no position or kWh is left, otherwise Available.
    private static BsonDocument FullOrAvailableExpression(BsonValue totalPositions, BsonValue capacityKwh) =>
        new("$cond", new BsonArray
        {
            new BsonDocument("$or", new BsonArray
            {
                new BsonDocument("$gte", new BsonArray { FieldOrZero("reservedPositions"), totalPositions }),
                new BsonDocument("$gte", new BsonArray { FieldOrZero("reservedKwh"), capacityKwh })
            }),
            SlotStatus.Full.ToString(),
            SlotStatus.Available.ToString()
        });

    // Same as above, but a slot the operator closed stays Closed.
    private static BsonDocument OpenStatusExpression(BsonValue totalPositions, BsonValue capacityKwh) =>
        new("$cond", new BsonArray
        {
            new BsonDocument("$eq", new BsonArray { "$status", SlotStatus.Closed.ToString() }),
            SlotStatus.Closed.ToString(),
            FullOrAvailableExpression(totalPositions, capacityKwh)
        });

    // Builds an expression that reads a numeric field, treating a missing field as zero.
    private static BsonDocument FieldOrZero(string fieldName) =>
        new("$ifNull", new BsonArray { "$" + fieldName, 0 });

    // Builds an expression that adds a value to another expression.
    private static BsonDocument Add(BsonValue expression, BsonValue value) =>
        new("$add", new BsonArray { expression, value });
}

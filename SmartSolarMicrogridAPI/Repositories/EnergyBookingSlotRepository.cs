/*
 * File: EnergyBookingSlotRepository.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
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

    // Builds an expression that reads a numeric field, treating a missing field as zero.
    private static BsonDocument FieldOrZero(string fieldName) =>
        new("$ifNull", new BsonArray { "$" + fieldName, 0 });

    // Builds an expression that adds a value to another expression.
    private static BsonDocument Add(BsonValue expression, BsonValue value) =>
        new("$add", new BsonArray { expression, value });
}

/*
 * File: MongoRepository.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Generic MongoDB implementation of the async CRUD repository contract.
 *
 * Individual Contribution: Implemented the generic MongoDB repository, including
 *                          updates that always keep the document id intact.
 */

using System.Linq.Expressions;
using MongoDB.Bson;
using MongoDB.Driver;
using SmartSolarMicrogridAPI.Models.Entities;
using SmartSolarMicrogridAPI.Repositories.Interfaces;

namespace SmartSolarMicrogridAPI.Repositories;

public class MongoRepository<T>(IMongoCollection<T> collection) : IMongoRepository<T> where T : class, IEntity
{
    protected readonly IMongoCollection<T> Collection = collection;

    // Returns every document in the collection.
    public async Task<IReadOnlyList<T>> GetAllAsync()
    {
        return await Collection.Find(FilterDefinition<T>.Empty).ToListAsync();
    }

    // Returns the document with the given id, or null when the id is invalid or not found.
    public async Task<T?> GetByIdAsync(string id)
    {
        if (!ObjectId.TryParse(id, out var objectId))
        {
            return null;
        }

        return await Collection.Find(Builders<T>.Filter.Eq("_id", objectId)).FirstOrDefaultAsync();
    }

    // Returns all documents matching the filter expression.
    public async Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> filter)
    {
        return await Collection.Find(filter).ToListAsync();
    }

    // Inserts the entity and returns it with its generated id populated.
    public async Task<T> CreateAsync(T entity)
    {
        await Collection.InsertOneAsync(entity);
        return entity;
    }

    // Replaces the document with the given id, forcing the entity's Id to match, and reports whether a document matched.
    public async Task<bool> UpdateAsync(string id, T entity)
    {
        if (!ObjectId.TryParse(id, out var objectId))
        {
            return false;
        }

        entity.Id = objectId.ToString();

        var result = await Collection.ReplaceOneAsync(Builders<T>.Filter.Eq("_id", objectId), entity);
        return result.MatchedCount > 0;
    }

    // Deletes the document with the given id and reports whether a document was removed.
    public async Task<bool> DeleteAsync(string id)
    {
        if (!ObjectId.TryParse(id, out var objectId))
        {
            return false;
        }

        var result = await Collection.DeleteOneAsync(Builders<T>.Filter.Eq("_id", objectId));
        return result.DeletedCount > 0;
    }

    // Reports whether any document matches the filter expression.
    public async Task<bool> ExistsAsync(Expression<Func<T, bool>> filter)
    {
        return await Collection.Find(filter).Limit(1).AnyAsync();
    }
}

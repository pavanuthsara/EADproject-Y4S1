/*
 * File: IMongoRepository.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 42
 * Description: Defines the generic async CRUD contract shared by all repositories.
 *
 * Individual Contribution: Defined the generic async CRUD repository contract.
 */

using System.Linq.Expressions;
using SmartSolarMicrogridAPI.Models.Entities;

namespace SmartSolarMicrogridAPI.Repositories.Interfaces;

public interface IMongoRepository<T> where T : class, IEntity
{
    // Returns every document in the collection.
    Task<IReadOnlyList<T>> GetAllAsync();

    // Finds a document by its ID, or null if it does not exist.
    Task<T?> GetByIdAsync(string id);

    // Returns the documents that match the filter.
    Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> filter);

    // Inserts a new document.
    Task<T> CreateAsync(T entity);

    // Replaces the document with the given ID; returns whether one was updated.
    Task<bool> UpdateAsync(string id, T entity);

    // Deletes the document with the given ID; returns whether one was deleted.
    Task<bool> DeleteAsync(string id);

    // Reports whether any document matches the filter.
    Task<bool> ExistsAsync(Expression<Func<T, bool>> filter);
}

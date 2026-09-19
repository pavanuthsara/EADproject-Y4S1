/*
 * File: IMongoRepository.cs
 * Purpose: Defines the generic async CRUD contract shared by all repositories.
 */

using System.Linq.Expressions;

namespace SmartSolarMicrogridAPI.Repositories.Interfaces;

public interface IMongoRepository<T> where T : class
{
    Task<IReadOnlyList<T>> GetAllAsync();
    Task<T?> GetByIdAsync(string id);
    Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> filter);
    Task<T> CreateAsync(T entity);
    Task<bool> UpdateAsync(string id, T entity);
    Task<bool> DeleteAsync(string id);
    Task<bool> ExistsAsync(Expression<Func<T, bool>> filter);
}

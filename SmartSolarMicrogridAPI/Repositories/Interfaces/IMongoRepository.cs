/*
 * File: IMongoRepository.cs
 * Author: Dulsara Manakal (IT23214552)
 * Group: 45
 * Description: Defines the generic async CRUD contract shared by all repositories.
 *
 * Individual Contribution: Defined the generic async CRUD repository contract.
 */

using System.Linq.Expressions;
using SmartSolarMicrogridAPI.Models.Entities;

namespace SmartSolarMicrogridAPI.Repositories.Interfaces;

public interface IMongoRepository<T> where T : class, IEntity
{
    Task<IReadOnlyList<T>> GetAllAsync();
    Task<T?> GetByIdAsync(string id);
    Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> filter);
    Task<T> CreateAsync(T entity);
    Task<bool> UpdateAsync(string id, T entity);
    Task<bool> DeleteAsync(string id);
    Task<bool> ExistsAsync(Expression<Func<T, bool>> filter);
}

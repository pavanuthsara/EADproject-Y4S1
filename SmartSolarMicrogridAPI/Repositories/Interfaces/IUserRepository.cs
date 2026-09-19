/*
 * File: IUserRepository.cs
 * Purpose: Defines user-specific data access on top of the generic repository contract.
 */

using SmartSolarMicrogridAPI.Models.Entities;

namespace SmartSolarMicrogridAPI.Repositories.Interfaces;

public interface IUserRepository : IMongoRepository<User>
{
    Task<User?> GetByNicAsync(string nic);
    Task<User?> GetByEmailAsync(string email);
}

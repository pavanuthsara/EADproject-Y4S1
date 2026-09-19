/*
 * File: UserRepository.cs
 * Purpose: MongoDB data access for the users collection.
 */

using MongoDB.Driver;
using SmartSolarMicrogridAPI.Data;
using SmartSolarMicrogridAPI.Models.Entities;
using SmartSolarMicrogridAPI.Repositories.Interfaces;

namespace SmartSolarMicrogridAPI.Repositories;

public class UserRepository : MongoRepository<User>, IUserRepository
{
    // Binds the repository to the users collection.
    public UserRepository(MongoDbContext context) : base(context.Users)
    {
    }

    // Returns the user with the given NIC, or null when none exists.
    public async Task<User?> GetByNicAsync(string nic)
    {
        return await Collection.Find(u => u.Nic == nic).FirstOrDefaultAsync();
    }

    // Returns the user with the given email, or null when none exists.
    public async Task<User?> GetByEmailAsync(string email)
    {
        return await Collection.Find(u => u.Email == email).FirstOrDefaultAsync();
    }
}

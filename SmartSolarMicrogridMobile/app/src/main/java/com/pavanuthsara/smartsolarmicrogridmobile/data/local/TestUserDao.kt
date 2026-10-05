package com.pavanuthsara.smartsolarmicrogridmobile.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface TestUserDao {
    // Saves a test user.
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(testUser: TestUser)

    // Finds a test user by ID, or null if not stored.
    @Query("SELECT * FROM testUsers WHERE nic = :userId")
    suspend fun getUser(userId: Int): TestUser?

    // Deletes every test user.
    @Query("DELETE FROM testUsers")
    suspend fun clearUsers()
}
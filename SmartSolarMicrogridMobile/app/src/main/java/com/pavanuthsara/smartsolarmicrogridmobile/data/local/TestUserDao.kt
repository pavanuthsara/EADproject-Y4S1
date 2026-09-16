package com.pavanuthsara.smartsolarmicrogridmobile.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface TestUserDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(testUser: TestUser)

    @Query("SELECT * FROM testUsers WHERE nic = :userId")
    suspend fun getUser(userId: Int): TestUser?

    @Query("DELETE FROM testUsers")
    suspend fun clearUsers()
}
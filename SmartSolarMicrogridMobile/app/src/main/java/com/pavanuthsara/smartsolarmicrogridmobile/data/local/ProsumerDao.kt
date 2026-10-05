package com.pavanuthsara.smartsolarmicrogridmobile.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface ProsumerDao {
    // Saves a prosumer, replacing any existing row with the same NIC.
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProsumer(prosumer: Prosumer)

    // Finds a prosumer by NIC, or null if not stored.
    @Query("SELECT * FROM prosumers WHERE nic = :nic")
    suspend fun getProsumer(nic: String): Prosumer?

    // Updates a stored prosumer.
    @androidx.room.Update
    suspend fun updateProsumer(prosumer: Prosumer)

    // Deletes the prosumer with the given NIC.
    @Query("DELETE FROM prosumers WHERE nic = :nic")
    suspend fun deleteProsumer(nic: String)
}
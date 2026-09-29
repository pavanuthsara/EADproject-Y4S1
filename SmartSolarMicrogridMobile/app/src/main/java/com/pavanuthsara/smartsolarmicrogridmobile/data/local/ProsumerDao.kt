package com.pavanuthsara.smartsolarmicrogridmobile.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface ProsumerDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProsumer(prosumer: Prosumer)

    @Query("SELECT * FROM prosumers WHERE nic = :nic")
    suspend fun getProsumer(nic: String): Prosumer?

    @androidx.room.Update
    suspend fun updateProsumer(prosumer: Prosumer)

    @Query("DELETE FROM prosumers WHERE nic = :nic")
    suspend fun deleteProsumer(nic: String)
}
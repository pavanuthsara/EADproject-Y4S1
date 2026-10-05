package com.pavanuthsara.smartsolarmicrogridmobile.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction

@Dao
abstract class CachedReservationDao {

    // Sorted by the ISO start time as text, which orders the same as the time itself.
    @Query("SELECT * FROM cached_reservations WHERE prosumerNic = :nic ORDER BY slotStartUtc DESC")
    abstract suspend fun getByNic(nic: String): List<CachedReservation>

    @Query("SELECT * FROM cached_reservations WHERE reservationId = :reservationId LIMIT 1")
    abstract suspend fun getById(reservationId: String): CachedReservation?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    abstract suspend fun upsert(reservation: CachedReservation)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    abstract suspend fun upsertAll(reservations: List<CachedReservation>)

    @Query("DELETE FROM cached_reservations WHERE prosumerNic = :nic")
    abstract suspend fun deleteByNic(nic: String)

    @Query("DELETE FROM cached_reservations")
    abstract suspend fun clear()

    // Swaps the user's cached reservations for the fresh list from the API in one step.
    @Transaction
    open suspend fun replaceAll(nic: String, reservations: List<CachedReservation>) {
        deleteByNic(nic)
        upsertAll(reservations)
    }
}

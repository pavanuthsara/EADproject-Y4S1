package com.pavanuthsara.smartsolarmicrogridmobile.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update

@Dao
interface ReservationDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertReservation(reservation: Reservation): Long

    @Update
    suspend fun updateReservation(reservation: Reservation)

    @Query("SELECT * FROM reservations WHERE prosumerNic = :nic ORDER BY id DESC")
    suspend fun getReservationsByNic(nic: String): List<Reservation>

    @Query("SELECT * FROM reservations WHERE id = :id LIMIT 1")
    suspend fun getReservationById(id: Long): Reservation?

    @Query("DELETE FROM reservations WHERE id = :id")
    suspend fun deleteReservation(id: Long)
}

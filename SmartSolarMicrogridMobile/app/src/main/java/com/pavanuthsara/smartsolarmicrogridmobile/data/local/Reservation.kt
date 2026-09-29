package com.pavanuthsara.smartsolarmicrogridmobile.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "reservations")
data class Reservation(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val prosumerNic: String,
    val type: String,
    val date: String,
    val time: String,
    val status: String = "Pending",
    val qrCodeData: String? = null
)

package com.pavanuthsara.smartsolarmicrogridmobile.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "prosumers")
data class Prosumer(
    @PrimaryKey val nic: String,
    val fullName: String,
    val email: String,
    val phoneNumber: String,
    val password: String
)
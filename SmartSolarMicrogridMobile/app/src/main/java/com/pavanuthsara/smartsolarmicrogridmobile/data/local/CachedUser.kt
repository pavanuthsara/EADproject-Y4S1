package com.pavanuthsara.smartsolarmicrogridmobile.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

// Local copy of the signed-in user's profile, cached from the login and profile responses.
// MongoDB (through the API) holds the real record; this copy is for display, routing, and offline fast-load.
@Entity(tableName = "cached_user")
data class CachedUser(
    @PrimaryKey val userId: String,
    val nic: String,
    val fullName: String,
    val email: String,
    val phone: String,
    val role: String,
    val address: String = "",
    val solarCapacityKw: Double = 0.0
)

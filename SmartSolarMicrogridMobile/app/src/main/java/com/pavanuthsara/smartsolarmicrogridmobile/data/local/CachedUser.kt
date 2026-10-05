package com.pavanuthsara.smartsolarmicrogridmobile.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

// Local copy of the signed-in user's profile, cached from the login response.
// MongoDB (through the API) holds the real record; this copy is only for display and routing.
@Entity(tableName = "cached_user")
data class CachedUser(
    @PrimaryKey val userId: String,
    val nic: String,
    val fullName: String,
    val email: String,
    val phone: String,
    val role: String
)

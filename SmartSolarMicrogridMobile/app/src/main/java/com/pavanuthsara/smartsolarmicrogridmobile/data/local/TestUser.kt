package com.pavanuthsara.smartsolarmicrogridmobile.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "testUsers")
data class TestUser(
    @PrimaryKey val nic: Int,
    val username: String,
    val email: String,
    val isLoggedIn: Boolean
)

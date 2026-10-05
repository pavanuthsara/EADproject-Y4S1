package com.pavanuthsara.smartsolarmicrogridmobile.data.api.models

import com.google.gson.annotations.SerializedName

data class LoginRequestDto(
    @SerializedName("email") val email: String? = null,
    @SerializedName("nic") val nic: String? = null,
    @SerializedName("password") val password: String
)

data class RegisterRequestDto(
    @SerializedName("nic") val nic: String,
    @SerializedName("fullName") val fullName: String,
    @SerializedName("email") val email: String,
    @SerializedName("phone") val phone: String,
    @SerializedName("password") val password: String,
    @SerializedName("address") val address: String,
    @SerializedName("solarCapacityKw") val solarCapacityKw: Double
)

data class AuthResponseDto(
    @SerializedName("token") val token: String,
    @SerializedName("expiresAtUtc") val expiresAtUtc: String?,
    @SerializedName("userId") val userId: String,
    @SerializedName("nic") val nic: String?,
    @SerializedName("fullName") val fullName: String,
    @SerializedName("email") val email: String,
    @SerializedName("phone") val phone: String?,
    @SerializedName("role") val role: String
)

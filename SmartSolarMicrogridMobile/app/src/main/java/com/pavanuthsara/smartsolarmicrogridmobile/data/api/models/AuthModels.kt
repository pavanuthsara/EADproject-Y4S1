package com.pavanuthsara.smartsolarmicrogridmobile.data.api.models

import com.google.gson.annotations.SerializedName

data class LoginRequestDto(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String
)

data class AuthResponseDto(
    @SerializedName("token") val token: String,
    @SerializedName("expiresAtUtc") val expiresAtUtc: String?,
    @SerializedName("userId") val userId: String,
    @SerializedName("fullName") val fullName: String,
    @SerializedName("email") val email: String,
    @SerializedName("role") val role: String
)

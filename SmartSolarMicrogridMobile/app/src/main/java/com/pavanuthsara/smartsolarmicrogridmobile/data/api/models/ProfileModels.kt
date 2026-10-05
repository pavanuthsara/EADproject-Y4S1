package com.pavanuthsara.smartsolarmicrogridmobile.data.api.models

import com.google.gson.annotations.SerializedName

data class UpdateProfileRequestDto(
    @SerializedName("fullName") val fullName: String,
    @SerializedName("email") val email: String,
    @SerializedName("phone") val phone: String,
    @SerializedName("address") val address: String,
    @SerializedName("solarCapacityKw") val solarCapacityKw: Double
)

data class UserProfileDto(
    @SerializedName("id") val id: String?,
    @SerializedName("role") val role: String?,
    @SerializedName("nic") val nic: String?,
    @SerializedName("fullName") val fullName: String?,
    @SerializedName("email") val email: String?,
    @SerializedName("phone") val phone: String?,
    @SerializedName("accountStatus") val accountStatus: String?,
    @SerializedName("address") val address: String?,
    @SerializedName("solarCapacityKw") val solarCapacityKw: Double?,
    @SerializedName("createdAt") val createdAt: String?
)

package com.pavanuthsara.smartsolarmicrogridmobile.data.api.models

import com.google.gson.annotations.SerializedName

data class VerifyQrRequestDto(
    @SerializedName("qrToken") val qrToken: String
)

data class QrVerificationResponseDto(
    @SerializedName("reservationId") val reservationId: String,
    @SerializedName("reservationNo") val reservationNo: String,
    @SerializedName("prosumerId") val prosumerId: String,
    @SerializedName("prosumerNic") val prosumerNic: String,
    @SerializedName("stationId") val stationId: String,
    @SerializedName("slotId") val slotId: String,
    @SerializedName("slotStartTime") val slotStartTime: String,
    @SerializedName("direction") val direction: String,
    @SerializedName("requestedKwh") val requestedKwh: Double,
    @SerializedName("status") val status: String,
    @SerializedName("qrToken") val qrToken: String,
    @SerializedName("approvedAt") val approvedAt: String?
)

data class TransferCompleteResponseDto(
    @SerializedName("reservationId") val reservationId: String,
    @SerializedName("reservationNo") val reservationNo: String,
    @SerializedName("status") val status: String,
    @SerializedName("completedBy") val completedBy: String,
    @SerializedName("completedAt") val completedAt: String
)

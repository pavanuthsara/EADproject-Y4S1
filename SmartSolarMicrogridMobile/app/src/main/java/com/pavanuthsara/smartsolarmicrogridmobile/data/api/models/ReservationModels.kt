package com.pavanuthsara.smartsolarmicrogridmobile.data.api.models

import com.google.gson.annotations.SerializedName

// POST /api/reservations. The prosumer identity comes from the token, not the body.
data class CreateReservationRequest(
    @SerializedName("stationId") val stationId: String,
    @SerializedName("slotId") val slotId: String,
    @SerializedName("direction") val direction: String,
    @SerializedName("requestedKwh") val requestedKwh: Double
)

// PUT /api/reservations/{id}. Fields left null are not sent, so only what changed is updated.
data class UpdateReservationRequest(
    @SerializedName("slotId") val slotId: String? = null,
    @SerializedName("direction") val direction: String? = null,
    @SerializedName("requestedKwh") val requestedKwh: Double? = null
)

// The reservation summary every reservation endpoint returns.
data class ReservationSummaryDto(
    @SerializedName("reservationId") val reservationId: String,
    @SerializedName("reservationNo") val reservationNo: String,
    @SerializedName("prosumerNic") val prosumerNic: String,
    @SerializedName("status") val status: String,
    @SerializedName("stationId") val stationId: String,
    @SerializedName("stationName") val stationName: String,
    @SerializedName("slotId") val slotId: String,
    @SerializedName("slotStartUtc") val slotStartUtc: String,
    @SerializedName("slotEndUtc") val slotEndUtc: String,
    @SerializedName("direction") val direction: String,
    @SerializedName("requestedKwh") val requestedKwh: Double,
    @SerializedName("createdAtUtc") val createdAtUtc: String,
    @SerializedName("updatedAtUtc") val updatedAtUtc: String,
    @SerializedName("canModify") val canModify: Boolean,
    @SerializedName("canCancel") val canCancel: Boolean,
    @SerializedName("rejectionReason") val rejectionReason: String?,
    // Text for the QR code. Sent by the API only while the reservation is Approved.
    @SerializedName("qrToken") val qrToken: String?,
    @SerializedName("message") val message: String?
)

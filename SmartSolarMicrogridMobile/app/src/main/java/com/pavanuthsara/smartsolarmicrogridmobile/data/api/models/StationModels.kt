package com.pavanuthsara.smartsolarmicrogridmobile.data.api.models

import com.google.gson.annotations.SerializedName

// A solar station (battery) from GET /api/stations/nearby.
data class StationDto(
    @SerializedName("id") val id: String,
    @SerializedName("stationName") val stationName: String,
    @SerializedName("stationCode") val stationCode: String,
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double,
    @SerializedName("addressLine") val addressLine: String,
    @SerializedName("city") val city: String,
    @SerializedName("capacityKwh") val capacityKwh: Double,
    @SerializedName("totalBays") val totalBays: Int,
    @SerializedName("operatingSchedule") val operatingSchedule: String?,
    @SerializedName("status") val status: String
)

// A bookable time window at a station from GET /api/stations/{id}/slots.
// Times are UTC ISO-8601 strings, for example "2026-10-08T09:00:00Z".
data class SlotDto(
    @SerializedName("id") val id: String,
    @SerializedName("stationId") val stationId: String,
    @SerializedName("startTime") val startTime: String,
    @SerializedName("endTime") val endTime: String,
    @SerializedName("totalPositions") val totalPositions: Int,
    @SerializedName("reservedPositions") val reservedPositions: Int,
    @SerializedName("capacityKwh") val capacityKwh: Double,
    @SerializedName("reservedKwh") val reservedKwh: Double,
    @SerializedName("supportedDirections") val supportedDirections: List<String>?,
    @SerializedName("status") val status: String
) {
    val freePositions: Int get() = (totalPositions - reservedPositions).coerceAtLeast(0)
    val freeKwh: Double get() = (capacityKwh - reservedKwh).coerceAtLeast(0.0)

    // The API decides whether a booking is accepted; this only decides how the slot is drawn.
    val isFull: Boolean get() = status == "Full" || freePositions == 0 || freeKwh <= 0.0

    // A slot with no listed directions accepts both.
    val directions: List<String>
        get() = supportedDirections?.takeIf { it.isNotEmpty() } ?: listOf("Inject", "Draw")
}

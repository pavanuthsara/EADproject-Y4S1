package com.pavanuthsara.smartsolarmicrogridmobile.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.ReservationSummaryDto

// Local copy of one of the signed-in prosumer's reservations, kept so the list and the
// home counts can show something before (or without) a reply from the API.
// MongoDB (through the API) holds the real record and decides its status; this copy
// is never edited on the phone and is replaced by every refresh.
@Entity(tableName = "cached_reservations")
data class CachedReservation(
    @PrimaryKey val reservationId: String,
    val prosumerNic: String,
    val reservationNo: String,
    val status: String,
    val stationId: String,
    val stationName: String,
    val slotId: String,
    val slotStartUtc: String,
    val slotEndUtc: String,
    val direction: String,
    val requestedKwh: Double,
    val createdAtUtc: String,
    val canModify: Boolean,
    val canCancel: Boolean,
    val rejectionReason: String?,
    val qrToken: String?
) {
    companion object {
        fun from(dto: ReservationSummaryDto) = CachedReservation(
            reservationId = dto.reservationId,
            prosumerNic = dto.prosumerNic,
            reservationNo = dto.reservationNo,
            status = dto.status,
            stationId = dto.stationId,
            stationName = dto.stationName,
            slotId = dto.slotId,
            slotStartUtc = dto.slotStartUtc,
            slotEndUtc = dto.slotEndUtc,
            direction = dto.direction,
            requestedKwh = dto.requestedKwh,
            createdAtUtc = dto.createdAtUtc,
            canModify = dto.canModify,
            canCancel = dto.canCancel,
            rejectionReason = dto.rejectionReason,
            qrToken = dto.qrToken
        )
    }
}

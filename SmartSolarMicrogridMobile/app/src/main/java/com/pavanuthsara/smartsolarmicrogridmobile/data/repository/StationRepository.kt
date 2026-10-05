package com.pavanuthsara.smartsolarmicrogridmobile.data.repository

import android.content.Context
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.ApiClient
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.ApiResult
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.SlotDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.StationDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.safeApiCall

// Stations and their bookable slots. Always read from the API: availability changes with
// every booking, so nothing here is cached on the phone.
class StationRepository(context: Context) {

    private val appContext = context.applicationContext

    // Stations within the given radius of a point, from the API.
    suspend fun nearbyStations(latitude: Double, longitude: Double, radiusMeters: Double): ApiResult<List<StationDto>> =
        safeApiCall("Could not load the solar stations.") {
            ApiClient.getService(appContext).getNearbyStations(latitude, longitude, radiusMeters)
        }

    // Slots the signed-in prosumer could still book, earliest first.
    suspend fun slots(stationId: String): ApiResult<List<SlotDto>> =
        when (val result = safeApiCall("Could not load the slots for this station.") {
            ApiClient.getService(appContext).getStationSlots(stationId)
        }) {
            is ApiResult.Success -> ApiResult.Success(result.data.sortedBy { it.startTime }, result.message)
            is ApiResult.Failure -> result
        }
}

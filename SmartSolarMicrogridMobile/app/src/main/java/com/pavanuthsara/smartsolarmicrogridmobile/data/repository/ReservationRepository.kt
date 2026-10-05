package com.pavanuthsara.smartsolarmicrogridmobile.data.repository

import android.content.Context
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.ApiClient
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.ApiResult
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.CreateReservationRequest
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.ReservationSummaryDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.UpdateReservationRequest
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.safeApiCall
import com.pavanuthsara.smartsolarmicrogridmobile.data.local.AppDatabase
import com.pavanuthsara.smartsolarmicrogridmobile.data.local.CachedReservation
import com.pavanuthsara.smartsolarmicrogridmobile.data.session.UserSession

// The prosumer's reservations. The API decides everything (rules, status, whether a change is
// allowed); Room only remembers the last answer so screens have something to show at once.
class ReservationRepository(context: Context) {

    private val appContext = context.applicationContext
    private val dao = AppDatabase.getDatabase(appContext).cachedReservationDao()
    private val userSession = UserSession(appContext)

    // What the phone remembers from the last successful call; empty when nobody is signed in.
    suspend fun cached(): List<CachedReservation> {
        val user = userSession.currentUser() ?: return emptyList()
        return dao.getByNic(user.nic)
    }

    suspend fun cachedById(reservationId: String): CachedReservation? = dao.getById(reservationId)

    // Downloads the whole history and replaces what was remembered.
    suspend fun refresh(): ApiResult<List<CachedReservation>> {
        val user = userSession.currentUser()
            ?: return ApiResult.Failure("Your session has expired. Please sign in again.", 401)

        return when (val result = safeApiCall("Could not load your reservations.") {
            ApiClient.getService(appContext).getReservationHistory()
        }) {
            is ApiResult.Success -> {
                val fresh = result.data.map(CachedReservation::from)
                dao.replaceAll(user.nic, fresh)
                ApiResult.Success(fresh, result.message)
            }
            is ApiResult.Failure -> result
        }
    }

    suspend fun create(request: CreateReservationRequest): ApiResult<ReservationSummaryDto> =
        remember(safeApiCall("Could not create the reservation.") {
            ApiClient.getService(appContext).createReservation(request)
        })

    suspend fun update(reservationId: String, request: UpdateReservationRequest): ApiResult<ReservationSummaryDto> =
        remember(safeApiCall("Could not update the reservation.") {
            ApiClient.getService(appContext).updateReservation(reservationId, request)
        })

    suspend fun cancel(reservationId: String): ApiResult<ReservationSummaryDto> =
        remember(safeApiCall("Could not cancel the reservation.") {
            ApiClient.getService(appContext).cancelReservation(reservationId)
        })

    // Keeps the remembered copy in step with the API's answer to a create, update or cancel.
    private suspend fun remember(result: ApiResult<ReservationSummaryDto>): ApiResult<ReservationSummaryDto> {
        if (result is ApiResult.Success) {
            dao.upsert(CachedReservation.from(result.data))
        }
        return result
    }
}

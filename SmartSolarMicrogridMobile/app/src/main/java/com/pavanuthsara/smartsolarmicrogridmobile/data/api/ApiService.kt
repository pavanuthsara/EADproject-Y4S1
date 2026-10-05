package com.pavanuthsara.smartsolarmicrogridmobile.data.api

import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.ApiResponse
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.AuthResponseDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.CreateReservationRequest
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.LoginRequestDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.QrVerificationResponseDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.RegisterRequestDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.ReservationSummaryDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.SlotDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.StationDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.TransferCompleteResponseDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.UpdateReservationRequest
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.VerifyQrRequestDto
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {

    // Signs in with NIC or email and password; returns a JWT.
    @POST("api/auth/login")
    suspend fun login(
        @Body request: LoginRequestDto
    ): Response<ApiResponse<AuthResponseDto>>

    // Prosumer self-registration. The account is created as Pending until Backoffice activates it.
    @POST("api/prosumer/register")
    suspend fun registerProsumer(
        @Body request: RegisterRequestDto
    ): Response<ApiResponse<AuthResponseDto>>

    // Active stations within radiusMeters of the point, nearest first. Prosumer role only.
    @GET("api/stations/nearby")
    suspend fun getNearbyStations(
        @Query("lat") latitude: Double,
        @Query("lng") longitude: Double,
        @Query("radiusMeters") radiusMeters: Double
    ): Response<ApiResponse<List<StationDto>>>

    // For a prosumer the API returns only slots that can still be booked.
    @GET("api/stations/{stationId}/slots")
    suspend fun getStationSlots(
        @Path("stationId") stationId: String
    ): Response<ApiResponse<List<SlotDto>>>

    // Books a slot for the signed-in prosumer.
    @POST("api/reservations")
    suspend fun createReservation(
        @Body request: CreateReservationRequest
    ): Response<ApiResponse<ReservationSummaryDto>>

    // Changes a reservation's slot, direction or energy amount.
    @PUT("api/reservations/{reservationId}")
    suspend fun updateReservation(
        @Path("reservationId") reservationId: String,
        @Body request: UpdateReservationRequest
    ): Response<ApiResponse<ReservationSummaryDto>>

    // A soft cancel: the reservation stays in the history as Cancelled.
    @DELETE("api/reservations/{reservationId}")
    suspend fun cancelReservation(
        @Path("reservationId") reservationId: String
    ): Response<ApiResponse<ReservationSummaryDto>>

    // The signed-in prosumer's own reservations, newest first.
    @GET("api/reservations/history")
    suspend fun getReservationHistory(): Response<ApiResponse<List<ReservationSummaryDto>>>

    // Checks a scanned reservation QR token (Grid Operator).
    @POST("api/transfers/verify")
    suspend fun verifyQr(
        @Body request: VerifyQrRequestDto
    ): Response<ApiResponse<QrVerificationResponseDto>>

    // Marks the energy transfer for a reservation as completed (Grid Operator).
    @POST("api/transfers/{reservationId}/complete")
    suspend fun completeTransfer(
        @Path("reservationId") reservationId: String
    ): Response<ApiResponse<TransferCompleteResponseDto>>
}

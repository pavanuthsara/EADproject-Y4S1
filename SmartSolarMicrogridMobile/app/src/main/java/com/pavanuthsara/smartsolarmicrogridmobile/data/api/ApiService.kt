package com.pavanuthsara.smartsolarmicrogridmobile.data.api

import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.ApiResponse
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.AuthResponseDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.LoginRequestDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.QrVerificationResponseDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.RegisterRequestDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.TransferCompleteResponseDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.VerifyQrRequestDto
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.Path

interface ApiService {

    @POST("api/auth/login")
    suspend fun login(
        @Body request: LoginRequestDto
    ): Response<ApiResponse<AuthResponseDto>>

    // Prosumer self-registration. The account is created as Pending until Backoffice activates it.
    @POST("api/prosumer/register")
    suspend fun registerProsumer(
        @Body request: RegisterRequestDto
    ): Response<ApiResponse<AuthResponseDto>>

    @POST("api/transfers/verify")
    suspend fun verifyQr(
        @Body request: VerifyQrRequestDto
    ): Response<ApiResponse<QrVerificationResponseDto>>

    @POST("api/transfers/{reservationId}/complete")
    suspend fun completeTransfer(
        @Path("reservationId") reservationId: String
    ): Response<ApiResponse<TransferCompleteResponseDto>>
}

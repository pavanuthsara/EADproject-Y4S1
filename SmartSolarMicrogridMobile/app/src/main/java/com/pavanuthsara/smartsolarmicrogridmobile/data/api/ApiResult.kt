package com.pavanuthsara.smartsolarmicrogridmobile.data.api

import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.ApiResponse
import kotlinx.coroutines.CancellationException
import retrofit2.Response
import java.io.IOException

// Outcome of one API call: the data and the API's message, or a message the user can act on.
sealed class ApiResult<out T> {
    data class Success<T>(val data: T, val message: String) : ApiResult<T>()

    data class Failure(val message: String, val statusCode: Int = 0) : ApiResult<Nothing>() {
        // A 401 means the token is missing, expired or rejected: the user must sign in again.
        val sessionExpired: Boolean get() = statusCode == 401
    }
}

// Runs a Retrofit call and turns every outcome into an ApiResult, so screens never handle raw errors.
suspend fun <T> safeApiCall(fallback: String, call: suspend () -> Response<ApiResponse<T>>): ApiResult<T> =
    try {
        val response = call()
        val body = response.body()
        val data = body?.data

        when {
            !response.isSuccessful -> ApiResult.Failure(
                ApiErrors.message(response.errorBody()?.string(), response.code(), fallback),
                response.code()
            )
            body == null || !body.success || data == null ->
                ApiResult.Failure(body?.message?.takeIf { it.isNotBlank() } ?: fallback, response.code())
            else -> ApiResult.Success(data, body.message)
        }
    } catch (e: CancellationException) {
        throw e
    } catch (e: IOException) {
        ApiResult.Failure("Cannot reach the server. Check the server address and your connection.")
    } catch (e: Exception) {
        ApiResult.Failure(fallback)
    }

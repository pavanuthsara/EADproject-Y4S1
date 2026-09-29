package com.pavanuthsara.smartsolarmicrogridmobile.ui.operator

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.google.gson.Gson
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.ApiClient
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.ApiResponse
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.QrVerificationResponseDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.TransferCompleteResponseDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.VerifyQrRequestDto
import kotlinx.coroutines.launch

sealed class VerifyState {
    object Idle : VerifyState()
    object Loading : VerifyState()
    data class Success(val data: QrVerificationResponseDto) : VerifyState()
    data class Error(val message: String) : VerifyState()
}

sealed class CompleteState {
    object Idle : CompleteState()
    object Loading : CompleteState()
    data class Success(val data: TransferCompleteResponseDto) : CompleteState()
    data class Error(val message: String) : CompleteState()
}

class OperatorViewModel(application: Application) : AndroidViewModel(application) {

    private val _verifyState = MutableLiveData<VerifyState>(VerifyState.Idle)
    val verifyState: LiveData<VerifyState> = _verifyState

    private val _completeState = MutableLiveData<CompleteState>(CompleteState.Idle)
    val completeState: LiveData<CompleteState> = _completeState

    fun verifyQrToken(qrToken: String) {
        _verifyState.value = VerifyState.Loading
        _completeState.value = CompleteState.Idle

        viewModelScope.launch {
            try {
                val apiService = ApiClient.getService(getApplication())
                val response = apiService.verifyQr(VerifyQrRequestDto(qrToken = qrToken))

                if (response.isSuccessful) {
                    val body = response.body()
                    if (body != null && body.success && body.data != null) {
                        _verifyState.value = VerifyState.Success(body.data)
                    } else {
                        _verifyState.value = VerifyState.Error(body?.message ?: "Verification failed.")
                    }
                } else {
                    val errorBody = response.errorBody()?.string()
                    val errorMessage = parseErrorMessage(errorBody, response.code())
                    _verifyState.value = VerifyState.Error(errorMessage)
                }
            } catch (e: Exception) {
                _verifyState.value = VerifyState.Error(
                    "Network error: ${e.localizedMessage ?: "Unable to connect to server"}"
                )
            }
        }
    }

    fun completeTransfer(reservationId: String) {
        _completeState.value = CompleteState.Loading

        viewModelScope.launch {
            try {
                val apiService = ApiClient.getService(getApplication())
                val response = apiService.completeTransfer(reservationId)

                if (response.isSuccessful) {
                    val body = response.body()
                    if (body != null && body.success && body.data != null) {
                        _completeState.value = CompleteState.Success(body.data)
                    } else {
                        _completeState.value = CompleteState.Error(body?.message ?: "Transfer completion failed.")
                    }
                } else {
                    val errorBody = response.errorBody()?.string()
                    val errorMessage = parseErrorMessage(errorBody, response.code())
                    _completeState.value = CompleteState.Error(errorMessage)
                }
            } catch (e: Exception) {
                _completeState.value = CompleteState.Error(
                    "Network error: ${e.localizedMessage ?: "Unable to connect to server"}"
                )
            }
        }
    }

    fun resetStates() {
        _verifyState.value = VerifyState.Idle
        _completeState.value = CompleteState.Idle
    }

    private fun parseErrorMessage(errorBody: String?, statusCode: Int): String {
        return try {
            if (!errorBody.isNullOrBlank()) {
                val parsed = Gson().fromJson(errorBody, ApiResponse::class.java)
                if (!parsed.message.isNullOrBlank()) {
                    return parsed.message
                }
            }
            "Server error ($statusCode)"
        } catch (e: Exception) {
            "Server error ($statusCode)"
        }
    }
}

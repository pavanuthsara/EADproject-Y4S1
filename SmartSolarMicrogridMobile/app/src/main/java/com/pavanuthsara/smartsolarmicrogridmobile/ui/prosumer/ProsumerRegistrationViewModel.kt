package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.ApiClient
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.ApiErrors
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.RegisterRequestDto
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch
import java.io.IOException

sealed class RegistrationStatus {
    data object Idle : RegistrationStatus()
    data object Loading : RegistrationStatus()
    data class Success(val message: String, val nic: String) : RegistrationStatus()
    data class Error(val message: String) : RegistrationStatus()
}

class ProsumerRegistrationViewModel(application: Application) : AndroidViewModel(application) {

    private val _registrationStatus = MutableLiveData<RegistrationStatus>(RegistrationStatus.Idle)
    val registrationStatus: LiveData<RegistrationStatus> = _registrationStatus

    // Creates the account on the server. The API checks NIC and email are unused and stores the
    // account as Pending; nothing is saved on the phone, so the user signs in afterwards.
    fun registerProsumer(request: RegisterRequestDto) {
        _registrationStatus.value = RegistrationStatus.Loading
        viewModelScope.launch {
            _registrationStatus.value = try {
                val response = ApiClient.getService(getApplication()).registerProsumer(request)
                val body = response.body()

                if (!response.isSuccessful) {
                    RegistrationStatus.Error(
                        ApiErrors.message(response.errorBody()?.string(), response.code(), REGISTRATION_FAILED)
                    )
                } else if (body == null || !body.success) {
                    RegistrationStatus.Error(REGISTRATION_FAILED)
                } else {
                    RegistrationStatus.Success(body.message.ifBlank { REGISTRATION_SUBMITTED }, request.nic)
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: IOException) {
                RegistrationStatus.Error("Cannot reach the server. Check the server address and your connection.")
            } catch (e: Exception) {
                RegistrationStatus.Error(REGISTRATION_FAILED)
            }
        }
    }

    companion object {
        private const val REGISTRATION_FAILED = "Registration failed. Please try again."
        private const val REGISTRATION_SUBMITTED = "Registration submitted. Please sign in."

        // New-format NIC: 12 digits. Old-format NIC: 9 digits followed by V.
        private val NIC_REGEX = Regex("^(\\d{12}|\\d{9}[vV])$")
        private val PHONE_REGEX = Regex("^07\\d{8}$")
        private val EMAIL_REGEX =
            Regex("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")

        // Same range the API accepts for solarCapacityKw.
        private const val MAX_SOLAR_CAPACITY_KW = 1000.0

        fun isValidNic(nic: String): Boolean = NIC_REGEX.matches(nic)

        fun isValidPhoneNumber(phone: String): Boolean = PHONE_REGEX.matches(phone)

        fun isValidEmail(email: String): Boolean = EMAIL_REGEX.matches(email)

        fun isValidPassword(password: String): Boolean = password.length >= 8

        // Returns the capacity in kW, or null if it is not a number between 0 and 1000.
        fun parseSolarCapacity(text: String): Double? =
            text.toDoubleOrNull()?.takeIf { it in 0.0..MAX_SOLAR_CAPACITY_KW }
    }
}

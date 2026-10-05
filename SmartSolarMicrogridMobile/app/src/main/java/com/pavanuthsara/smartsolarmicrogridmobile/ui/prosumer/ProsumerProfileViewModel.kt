package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.ApiClient
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.ApiErrors
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.UpdateProfileRequestDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.local.CachedUser
import com.pavanuthsara.smartsolarmicrogridmobile.data.session.UserSession
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch
import java.io.IOException

sealed class ProfileLoadStatus {
    object Idle : ProfileLoadStatus()
    object Loading : ProfileLoadStatus()
    data class Loaded(val user: CachedUser) : ProfileLoadStatus()
    object SignedOut : ProfileLoadStatus()
    data class Error(val message: String) : ProfileLoadStatus()
}

sealed class ProfileActionStatus {
    object Idle : ProfileActionStatus()
    object Loading : ProfileActionStatus()
    data class UpdateSuccess(val message: String) : ProfileActionStatus()
    data class UpdateError(val message: String) : ProfileActionStatus()
    data class DeactivationSuccess(val message: String) : ProfileActionStatus()
    data class DeactivationError(val message: String) : ProfileActionStatus()
}

class ProsumerProfileViewModel(application: Application) : AndroidViewModel(application) {

    private val userSession = UserSession(application)
    private val apiService = ApiClient.getService(application)

    private val _loadStatus = MutableLiveData<ProfileLoadStatus>(ProfileLoadStatus.Idle)
    val loadStatus: LiveData<ProfileLoadStatus> = _loadStatus

    private val _actionStatus = MutableLiveData<ProfileActionStatus>(ProfileActionStatus.Idle)
    val actionStatus: LiveData<ProfileActionStatus> = _actionStatus

    fun loadProfile() {
        _loadStatus.value = ProfileLoadStatus.Loading
        viewModelScope.launch {
            // First load from local Room cache for instant UI rendering
            val cached = userSession.currentUser()
            if (cached == null) {
                _loadStatus.value = ProfileLoadStatus.SignedOut
                return@launch
            }
            _loadStatus.value = ProfileLoadStatus.Loaded(cached)

            // Then fetch latest details from the API
            try {
                val response = apiService.getProfile()
                if (response.isSuccessful) {
                    val profile = response.body()?.data
                    if (profile != null) {
                        userSession.updateCachedProfile(
                            fullName = profile.fullName ?: cached.fullName,
                            email = profile.email ?: cached.email,
                            phone = profile.phone ?: cached.phone,
                            address = profile.address ?: cached.address,
                            solarCapacityKw = profile.solarCapacityKw ?: cached.solarCapacityKw
                        )
                        val updated = userSession.currentUser()
                        if (updated != null) {
                            _loadStatus.value = ProfileLoadStatus.Loaded(updated)
                        }
                    }
                }
            } catch (e: Exception) {
                // If offline or network error, local cache remains displayed
            }
        }
    }

    fun updateProfile(
        fullName: String,
        email: String,
        phone: String,
        address: String,
        solarCapacityKw: Double
    ) {
        val trimmedName = fullName.trim()
        val trimmedEmail = email.trim()
        val trimmedPhone = phone.trim()
        val trimmedAddress = address.trim()

        if (trimmedName.length < 2) {
            _actionStatus.value = ProfileActionStatus.UpdateError("Full name must be at least 2 characters.")
            return
        }
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(trimmedEmail).matches()) {
            _actionStatus.value = ProfileActionStatus.UpdateError("Enter a valid email address.")
            return
        }
        if (!isValidPhone(trimmedPhone)) {
            _actionStatus.value = ProfileActionStatus.UpdateError("Phone number must contain 10 digits and start with 07.")
            return
        }
        if (trimmedAddress.isEmpty()) {
            _actionStatus.value = ProfileActionStatus.UpdateError("Address cannot be empty.")
            return
        }
        if (solarCapacityKw < 0) {
            _actionStatus.value = ProfileActionStatus.UpdateError("Solar capacity must be a positive number.")
            return
        }

        _actionStatus.value = ProfileActionStatus.Loading
        viewModelScope.launch {
            try {
                val request = UpdateProfileRequestDto(
                    fullName = trimmedName,
                    email = trimmedEmail,
                    phone = trimmedPhone,
                    address = trimmedAddress,
                    solarCapacityKw = solarCapacityKw
                )
                val response = apiService.updateProfile(request)
                if (response.isSuccessful && response.body()?.success == true) {
                    userSession.updateCachedProfile(
                        fullName = trimmedName,
                        email = trimmedEmail,
                        phone = trimmedPhone,
                        address = trimmedAddress,
                        solarCapacityKw = solarCapacityKw
                    )
                    val updated = userSession.currentUser()
                    if (updated != null) {
                        _loadStatus.value = ProfileLoadStatus.Loaded(updated)
                    }
                    _actionStatus.value = ProfileActionStatus.UpdateSuccess(
                        response.body()?.message ?: "Profile updated successfully."
                    )
                } else {
                    val errorMsg = ApiErrors.message(
                        response.errorBody()?.string(),
                        response.code(),
                        "Failed to update profile."
                    )
                    _actionStatus.value = ProfileActionStatus.UpdateError(errorMsg)
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: IOException) {
                _actionStatus.value = ProfileActionStatus.UpdateError(
                    "Cannot reach the server. Check your connection."
                )
            } catch (e: Exception) {
                _actionStatus.value = ProfileActionStatus.UpdateError(
                    e.message ?: "An unexpected error occurred."
                )
            }
        }
    }

    fun deactivateAccount() {
        _actionStatus.value = ProfileActionStatus.Loading
        viewModelScope.launch {
            try {
                val response = apiService.deactivateAccount()
                if (response.isSuccessful && response.body()?.success == true) {
                    userSession.signOut()
                    _actionStatus.value = ProfileActionStatus.DeactivationSuccess(
                        "Account deactivated successfully. Backoffice approval from the web is required for reactivation."
                    )
                } else {
                    val errorMsg = ApiErrors.message(
                        response.errorBody()?.string(),
                        response.code(),
                        "Failed to deactivate account."
                    )
                    _actionStatus.value = ProfileActionStatus.DeactivationError(errorMsg)
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: IOException) {
                _actionStatus.value = ProfileActionStatus.DeactivationError(
                    "Cannot reach the server. Check your connection."
                )
            } catch (e: Exception) {
                _actionStatus.value = ProfileActionStatus.DeactivationError(
                    e.message ?: "An unexpected error occurred."
                )
            }
        }
    }

    private fun isValidPhone(phone: String): Boolean =
        phone.length == 10 && phone.startsWith("07") && phone.all { it.isDigit() }
}

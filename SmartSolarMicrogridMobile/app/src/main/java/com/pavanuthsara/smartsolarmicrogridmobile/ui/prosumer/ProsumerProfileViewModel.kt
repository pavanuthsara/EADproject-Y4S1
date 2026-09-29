package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.pavanuthsara.smartsolarmicrogridmobile.data.local.AppDatabase
import com.pavanuthsara.smartsolarmicrogridmobile.data.local.Prosumer
import kotlinx.coroutines.launch

sealed class ProfileStatus {
    object Idle : ProfileStatus()
    object Loading : ProfileStatus()
    data class Loaded(val prosumer: Prosumer) : ProfileStatus()
    object UpdateSuccess : ProfileStatus()
    object DeactivateSuccess : ProfileStatus()
    data class Error(val message: String) : ProfileStatus()
}

class ProsumerProfileViewModel(application: Application) : AndroidViewModel(application) {
    private val prosumerDao = AppDatabase.getDatabase(application).prosumerDao()

    private val _profileStatus = MutableLiveData<ProfileStatus>(ProfileStatus.Idle)
    val profileStatus: LiveData<ProfileStatus> = _profileStatus

    private var currentProsumer: Prosumer? = null

    fun loadProfile(nic: String) {
        _profileStatus.value = ProfileStatus.Loading
        viewModelScope.launch {
            try {
                val prosumer = prosumerDao.getProsumer(nic)
                if (prosumer != null) {
                    currentProsumer = prosumer
                    _profileStatus.value = ProfileStatus.Loaded(prosumer)
                } else {
                    _profileStatus.value = ProfileStatus.Error("Profile not found.")
                }
            } catch (e: Exception) {
                _profileStatus.value = ProfileStatus.Error("Failed to load profile: ${e.message}")
            }
        }
    }

    fun updateProfile(fullName: String, email: String, phone: String) {
        val prosumer = currentProsumer ?: return
        viewModelScope.launch {
            try {
                val updatedProsumer = prosumer.copy(
                    fullName = fullName,
                    email = email,
                    phoneNumber = phone
                )
                prosumerDao.updateProsumer(updatedProsumer)
                currentProsumer = updatedProsumer
                _profileStatus.value = ProfileStatus.UpdateSuccess
            } catch (e: Exception) {
                _profileStatus.value = ProfileStatus.Error("Failed to update profile: ${e.message}")
            }
        }
    }

    fun deactivateAccount() {
        val nic = currentProsumer?.nic ?: return
        viewModelScope.launch {
            try {
                prosumerDao.deleteProsumer(nic)
                _profileStatus.value = ProfileStatus.DeactivateSuccess
            } catch (e: Exception) {
                _profileStatus.value = ProfileStatus.Error("Failed to deactivate account: ${e.message}")
            }
        }
    }
}

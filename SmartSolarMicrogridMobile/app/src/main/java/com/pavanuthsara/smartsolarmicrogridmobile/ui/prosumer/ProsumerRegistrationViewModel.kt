package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.pavanuthsara.smartsolarmicrogridmobile.data.local.AppDatabase
import com.pavanuthsara.smartsolarmicrogridmobile.data.local.Prosumer
import kotlinx.coroutines.launch

sealed class RegistrationStatus {
    data object Idle : RegistrationStatus()
    data object Success : RegistrationStatus()
    data class Error(val message: String) : RegistrationStatus()
}

class ProsumerRegistrationViewModel(application: Application) : AndroidViewModel(application) {

    private val prosumerDao = AppDatabase.getDatabase(application).prosumerDao()

    private val _registrationStatus = MutableLiveData<RegistrationStatus>(RegistrationStatus.Idle)
    val registrationStatus: LiveData<RegistrationStatus> = _registrationStatus

    fun registerProsumer(
        nic: String,
        fullName: String,
        email: String,
        phoneNumber: String,
        password: String
    ) {
        viewModelScope.launch {
            prosumerDao.insertProsumer(Prosumer(nic, fullName, email, phoneNumber, password))
            _registrationStatus.value = RegistrationStatus.Success
        }
    }

    companion object {
        private val NIC_REGEX = Regex("^(\\d{12}|\\d{10}[vV])$")
        private val PHONE_REGEX = Regex("^07\\d{8}$")
        private val EMAIL_REGEX =
            Regex("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")

        fun isValidNic(nic: String): Boolean = NIC_REGEX.matches(nic)

        fun isValidPhoneNumber(phone: String): Boolean = PHONE_REGEX.matches(phone)

        fun isValidEmail(email: String): Boolean = EMAIL_REGEX.matches(email)

        fun isValidPassword(password: String): Boolean = password.length >= 8
    }
}
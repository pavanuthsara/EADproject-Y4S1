package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.pavanuthsara.smartsolarmicrogridmobile.data.local.AppDatabase
import kotlinx.coroutines.launch

sealed class LoginStatus {
    object Idle : LoginStatus()
    object Success : LoginStatus()
    data class Error(val message: String) : LoginStatus()
}

class ProsumerLoginViewModel(application: Application) : AndroidViewModel(application) {
    private val prosumerDao = AppDatabase.getDatabase(application).prosumerDao()

    private val _loginStatus = MutableLiveData<LoginStatus>(LoginStatus.Idle)
    val loginStatus: LiveData<LoginStatus> = _loginStatus

    fun login(nic: String, password: String) {
        viewModelScope.launch {
            try {
                val prosumer = prosumerDao.getProsumer(nic)
                if (prosumer != null) {
                    if (prosumer.password == password) {
                        _loginStatus.value = LoginStatus.Success
                    } else {
                        _loginStatus.value = LoginStatus.Error("Incorrect password.")
                    }
                } else {
                    _loginStatus.value = LoginStatus.Error("User with NIC not found.")
                }
            } catch (e: Exception) {
                _loginStatus.value = LoginStatus.Error("Login failed: ${e.message}")
            }
        }
    }
}

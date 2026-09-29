package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.google.gson.Gson
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.ApiClient
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.ApiResponse
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.AuthResponseDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.LoginRequestDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.local.AppDatabase
import com.pavanuthsara.smartsolarmicrogridmobile.data.session.SessionManager
import kotlinx.coroutines.launch

sealed class LoginStatus {
    object Idle : LoginStatus()
    object Loading : LoginStatus()
    data class ProsumerSuccess(val nic: String) : LoginStatus()
    data class OperatorSuccess(val auth: AuthResponseDto) : LoginStatus()
    data class Error(val message: String) : LoginStatus()
}

class ProsumerLoginViewModel(application: Application) : AndroidViewModel(application) {
    private val prosumerDao = AppDatabase.getDatabase(application).prosumerDao()
    private val sessionManager = SessionManager.getInstance(application)

    private val _loginStatus = MutableLiveData<LoginStatus>(LoginStatus.Idle)
    val loginStatus: LiveData<LoginStatus> = _loginStatus

    fun loginProsumer(nic: String, password: String) {
        _loginStatus.value = LoginStatus.Loading
        viewModelScope.launch {
            try {
                val prosumer = prosumerDao.getProsumer(nic)
                if (prosumer != null) {
                    if (prosumer.password == password) {
                        _loginStatus.value = LoginStatus.ProsumerSuccess(nic)
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

    fun loginOperator(email: String, password: String) {
        _loginStatus.value = LoginStatus.Loading
        viewModelScope.launch {
            try {
                val apiService = ApiClient.getService(getApplication())
                val response = apiService.login(LoginRequestDto(email = email, password = password))

                if (response.isSuccessful) {
                    val body = response.body()
                    val authData = body?.data
                    if (body != null && body.success && authData != null) {
                        // Check if role is GridOperator or Backoffice
                        val role = authData.role
                        if (role.equals("GridOperator", ignoreCase = true) || role.equals("Backoffice", ignoreCase = true)) {
                            sessionManager.saveAuthSession(
                                token = authData.token,
                                userId = authData.userId,
                                fullName = authData.fullName,
                                email = authData.email,
                                role = authData.role
                            )
                            _loginStatus.value = LoginStatus.OperatorSuccess(authData)
                        } else {
                            _loginStatus.value = LoginStatus.Error("Access restricted: Grid Operator credentials required.")
                        }
                    } else {
                        _loginStatus.value = LoginStatus.Error(body?.message ?: "Authentication failed.")
                    }
                } else {
                    val errorBody = response.errorBody()?.string()
                    val errorMessage = try {
                        val parsed = Gson().fromJson(errorBody, ApiResponse::class.java)
                        parsed.message
                    } catch (e: Exception) {
                        "Authentication error (${response.code()})"
                    }
                    _loginStatus.value = LoginStatus.Error(errorMessage.ifBlank { "Invalid email or password." })
                }
            } catch (e: Exception) {
                _loginStatus.value = LoginStatus.Error("Network error: ${e.localizedMessage ?: "Unable to connect to server"}")
            }
        }
    }
}

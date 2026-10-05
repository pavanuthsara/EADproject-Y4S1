package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.ApiClient
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.ApiErrors
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.AuthResponseDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.LoginRequestDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.session.UserRoles
import com.pavanuthsara.smartsolarmicrogridmobile.data.session.UserSession
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch
import java.io.IOException

// Which tab the user signed in from. It only says which home screen they expect;
// the role itself always comes from the API.
enum class LoginPortal { PROSUMER, OPERATOR }

sealed class LoginStatus {
    object Idle : LoginStatus()
    object Loading : LoginStatus()
    data class ProsumerSuccess(val fullName: String) : LoginStatus()
    data class OperatorSuccess(val auth: AuthResponseDto) : LoginStatus()
    data class Error(val message: String) : LoginStatus()
}

class ProsumerLoginViewModel(application: Application) : AndroidViewModel(application) {

    private val userSession = UserSession(application)

    private val _loginStatus = MutableLiveData<LoginStatus>(LoginStatus.Idle)
    val loginStatus: LiveData<LoginStatus> = _loginStatus

    // Signs in through the API, checks the returned role matches the tab used, then stores the session.
    // Prosumers sign in with their NIC; staff sign in with their email.
    fun login(identifier: String, password: String, portal: LoginPortal) {
        _loginStatus.value = LoginStatus.Loading
        val request = when (portal) {
            LoginPortal.PROSUMER -> LoginRequestDto(nic = identifier, password = password)
            LoginPortal.OPERATOR -> LoginRequestDto(email = identifier, password = password)
        }
        val invalidCredentials = when (portal) {
            LoginPortal.PROSUMER -> "Invalid NIC or password."
            LoginPortal.OPERATOR -> "Invalid email or password."
        }

        viewModelScope.launch {
            _loginStatus.value = try {
                val response = ApiClient.getService(getApplication()).login(request)
                val body = response.body()
                val auth = body?.data

                if (!response.isSuccessful) {
                    LoginStatus.Error(
                        ApiErrors.message(response.errorBody()?.string(), response.code(), invalidCredentials)
                    )
                } else if (body == null || !body.success || auth == null) {
                    LoginStatus.Error(invalidCredentials)
                } else {
                    completeSignIn(auth, portal)
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: IOException) {
                LoginStatus.Error("Cannot reach the server. Check the server address and your connection.")
            } catch (e: Exception) {
                LoginStatus.Error("Sign-in failed. Please try again.")
            }
        }
    }

    // A role that does not match the tab is refused before anything is stored on the device.
    private suspend fun completeSignIn(auth: AuthResponseDto, portal: LoginPortal): LoginStatus {
        roleMismatchMessage(auth.role, portal)?.let { return LoginStatus.Error(it) }

        userSession.signIn(auth)
        return when (portal) {
            LoginPortal.PROSUMER -> LoginStatus.ProsumerSuccess(auth.fullName)
            LoginPortal.OPERATOR -> LoginStatus.OperatorSuccess(auth)
        }
    }

    // Returns why the role cannot use the chosen tab, or null when it can.
    private fun roleMismatchMessage(role: String, portal: LoginPortal): String? = when (portal) {
        LoginPortal.PROSUMER ->
            if (UserRoles.isProsumer(role)) null
            else "This is a staff account. Use the Grid Operator tab to sign in."
        LoginPortal.OPERATOR ->
            if (UserRoles.canUseOperatorDashboard(role)) null
            else "This is a prosumer account. Use the Solar Prosumer tab to sign in."
    }
}

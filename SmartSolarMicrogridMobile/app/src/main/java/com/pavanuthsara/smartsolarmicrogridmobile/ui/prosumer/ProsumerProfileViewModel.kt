package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.pavanuthsara.smartsolarmicrogridmobile.data.local.CachedUser
import com.pavanuthsara.smartsolarmicrogridmobile.data.session.UserSession
import kotlinx.coroutines.launch

sealed class ProfileStatus {
    object Idle : ProfileStatus()
    object Loading : ProfileStatus()
    data class Loaded(val user: CachedUser) : ProfileStatus()
    object SignedOut : ProfileStatus()
}

class ProsumerProfileViewModel(application: Application) : AndroidViewModel(application) {

    private val userSession = UserSession(application)

    private val _profileStatus = MutableLiveData<ProfileStatus>(ProfileStatus.Idle)
    val profileStatus: LiveData<ProfileStatus> = _profileStatus

    // Shows the profile cached at sign-in. Editing and deactivation will go through the API
    // in the profile step; until then this screen is read-only.
    fun loadProfile() {
        _profileStatus.value = ProfileStatus.Loading
        viewModelScope.launch {
            val user = userSession.currentUser()
            _profileStatus.value = if (user == null) ProfileStatus.SignedOut else ProfileStatus.Loaded(user)
        }
    }
}

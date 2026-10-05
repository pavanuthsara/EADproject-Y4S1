package com.pavanuthsara.smartsolarmicrogridmobile.data.session

import android.content.Context
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.AuthResponseDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.local.AppDatabase
import com.pavanuthsara.smartsolarmicrogridmobile.data.local.CachedUser

// The user signed in on this device: the token in encrypted preferences and a cached copy
// of their profile in Room. The cache is used for display and to pick a home screen;
// every access decision is made by the API.
class UserSession(context: Context) {

    private val sessionManager = SessionManager.getInstance(context)
    private val cachedUserDao = AppDatabase.getDatabase(context).cachedUserDao()

    // Saves a successful login. The profile is cached first so a stored token always has a user.
    suspend fun signIn(auth: AuthResponseDto) {
        cachedUserDao.replace(
            CachedUser(
                userId = auth.userId,
                nic = auth.nic.orEmpty(),
                fullName = auth.fullName,
                email = auth.email,
                phone = auth.phone.orEmpty(),
                role = auth.role
            )
        )
        sessionManager.saveToken(auth.token)
    }

    // The signed-in user, or null when there is no unexpired token.
    suspend fun currentUser(): CachedUser? =
        if (sessionManager.isLoggedIn()) cachedUserDao.get() else null

    suspend fun signOut() {
        sessionManager.clearToken()
        cachedUserDao.clear()
    }
}

package com.pavanuthsara.smartsolarmicrogridmobile.data.session

import android.content.Context
import android.content.SharedPreferences

class SessionManager(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

    companion object {
        private const val PREF_NAME = "smart_solar_session"
        private const val KEY_TOKEN = "auth_token"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_FULL_NAME = "full_name"
        private const val KEY_EMAIL = "email"
        private const val KEY_ROLE = "role"
        private const val KEY_STATION_ID = "active_station_id"
        private const val KEY_BASE_URL = "custom_base_url"

        // Default base URL: 10.0.2.2 is Android emulator localhost alias.
        // For physical device, user/developer can update it.
        const val DEFAULT_BASE_URL = "http://10.0.2.2:5014/"

        @Volatile
        private var instance: SessionManager? = null

        fun getInstance(context: Context): SessionManager {
            return instance ?: synchronized(this) {
                instance ?: SessionManager(context.applicationContext).also { instance = it }
            }
        }
    }

    fun saveAuthSession(token: String, userId: String, fullName: String, email: String, role: String) {
        prefs.edit().apply {
            putString(KEY_TOKEN, token)
            putString(KEY_USER_ID, userId)
            putString(KEY_FULL_NAME, fullName)
            putString(KEY_EMAIL, email)
            putString(KEY_ROLE, role)
            apply()
        }
    }

    fun getAuthToken(): String? = prefs.getString(KEY_TOKEN, null)

    fun getUserId(): String? = prefs.getString(KEY_USER_ID, null)

    fun getFullName(): String? = prefs.getString(KEY_FULL_NAME, null)

    fun getEmail(): String? = prefs.getString(KEY_EMAIL, null)

    fun getRole(): String? = prefs.getString(KEY_ROLE, null)

    fun isGridOperator(): Boolean = getRole().equals("GridOperator", ignoreCase = true)

    fun isLoggedIn(): Boolean = !getAuthToken().isNullOrBlank()

    fun getActiveStationId(): String? = prefs.getString(KEY_STATION_ID, null)

    fun setActiveStationId(stationId: String?) {
        prefs.edit().putString(KEY_STATION_ID, stationId).apply()
    }

    fun getBaseUrl(): String = prefs.getString(KEY_BASE_URL, DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL

    fun setBaseUrl(url: String) {
        val formatted = if (url.endsWith("/")) url else "$url/"
        prefs.edit().putString(KEY_BASE_URL, formatted).apply()
    }

    fun clearSession() {
        prefs.edit().apply {
            remove(KEY_TOKEN)
            remove(KEY_USER_ID)
            remove(KEY_FULL_NAME)
            remove(KEY_EMAIL)
            remove(KEY_ROLE)
            remove(KEY_STATION_ID)
            apply()
        }
    }
}

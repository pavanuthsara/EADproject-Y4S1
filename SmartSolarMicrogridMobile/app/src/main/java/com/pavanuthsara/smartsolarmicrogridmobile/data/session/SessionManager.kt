package com.pavanuthsara.smartsolarmicrogridmobile.data.session

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.io.IOException
import java.security.GeneralSecurityException

// Device-level session storage: the JWT and its expiry in encrypted preferences, and the
// server address in plain preferences. The signed-in user's profile is cached in Room
// (see UserSession). Nothing stored here decides access; the API does.
class SessionManager private constructor(context: Context) {

    private val appContext = context.applicationContext

    private val prefs: SharedPreferences =
        appContext.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

    private val securePrefs: SharedPreferences = openSecurePrefs()

    init {
        removeLegacySessionData()
    }

    companion object {
        private const val PREF_NAME = "smart_solar_session"
        private const val SECURE_PREF_NAME = "secure_session"
        private const val KEY_TOKEN = "auth_token"
        private const val KEY_TOKEN_EXPIRES_AT = "auth_token_expires_at"
        private const val KEY_BASE_URL = "custom_base_url"

        // Older builds kept the session in plain preferences; it is removed on first run of this version.
        private val LEGACY_PLAIN_KEYS =
            listOf("auth_token", "user_id", "full_name", "email", "role", "active_station_id")
        private const val LEGACY_APP_PREFS = "app_prefs"
        private const val LEGACY_NIC_KEY = "logged_in_nic"

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

    // Stores the token issued by the API together with the expiry read from it.
    fun saveToken(token: String) {
        securePrefs.edit()
            .putString(KEY_TOKEN, token)
            .putLong(KEY_TOKEN_EXPIRES_AT, JwtExpiry.epochMillis(token) ?: 0L)
            .apply()
    }

    fun getAuthToken(): String? = securePrefs.getString(KEY_TOKEN, null)

    // True when a token is stored and has not reached its expiry. An unreadable expiry is
    // treated as valid; the API rejects the token if it is not.
    fun isLoggedIn(): Boolean {
        if (getAuthToken().isNullOrBlank()) return false
        val expiresAt = securePrefs.getLong(KEY_TOKEN_EXPIRES_AT, 0L)
        return expiresAt == 0L || System.currentTimeMillis() < expiresAt
    }

    fun clearToken() {
        securePrefs.edit().clear().apply()
    }

    fun getBaseUrl(): String = prefs.getString(KEY_BASE_URL, DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL

    fun setBaseUrl(url: String) {
        val formatted = if (url.endsWith("/")) url else "$url/"
        prefs.edit().putString(KEY_BASE_URL, formatted).apply()
    }

    private fun openSecurePrefs(): SharedPreferences {
        return try {
            createSecurePrefs()
        } catch (e: GeneralSecurityException) {
            resetSecurePrefs()
        } catch (e: IOException) {
            resetSecurePrefs()
        }
    }

    // The encryption key lives in the Android Keystore. If the stored file can no longer be
    // decrypted (for example after a restore onto a new device), start again with an empty one.
    private fun resetSecurePrefs(): SharedPreferences {
        appContext.deleteSharedPreferences(SECURE_PREF_NAME)
        return createSecurePrefs()
    }

    private fun createSecurePrefs(): SharedPreferences {
        val masterKey = MasterKey.Builder(appContext)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        return EncryptedSharedPreferences.create(
            appContext,
            SECURE_PREF_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    private fun removeLegacySessionData() {
        val editor = prefs.edit()
        LEGACY_PLAIN_KEYS.forEach { editor.remove(it) }
        editor.apply()

        appContext.getSharedPreferences(LEGACY_APP_PREFS, Context.MODE_PRIVATE)
            .edit()
            .remove(LEGACY_NIC_KEY)
            .apply()
    }
}

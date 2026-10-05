package com.pavanuthsara.smartsolarmicrogridmobile.data.session

import android.util.Base64
import org.json.JSONException
import org.json.JSONObject

// Reads the "exp" claim from a JWT so the app knows when to stop treating the session as signed in.
// The signature is not checked here; the API validates every token it receives.
internal object JwtExpiry {

    // Returns the token's expiry as epoch milliseconds, or null if it cannot be read.
    fun epochMillis(token: String): Long? {
        val payload = token.split('.').getOrNull(1) ?: return null
        return try {
            val json = String(
                Base64.decode(payload, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING),
                Charsets.UTF_8
            )
            JSONObject(json).optLong("exp", 0L).takeIf { it > 0L }?.times(1000L)
        } catch (e: IllegalArgumentException) {
            null
        } catch (e: JSONException) {
            null
        }
    }
}

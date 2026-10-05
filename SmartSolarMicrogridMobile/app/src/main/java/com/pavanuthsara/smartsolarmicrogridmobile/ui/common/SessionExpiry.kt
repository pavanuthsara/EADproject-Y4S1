package com.pavanuthsara.smartsolarmicrogridmobile.ui.common

import android.content.Intent
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.pavanuthsara.smartsolarmicrogridmobile.data.session.UserSession
import com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer.ProsumerLoginActivity
import kotlinx.coroutines.launch

// The API rejected the token (401): clear the local session and send the user back to sign in.
fun AppCompatActivity.endExpiredSession() {
    Toast.makeText(this, "Your session has expired. Please sign in again.", Toast.LENGTH_LONG).show()
    val activity = this
    lifecycleScope.launch {
        UserSession(activity).signOut()
        val intent = Intent(activity, ProsumerLoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
}

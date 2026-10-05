package com.pavanuthsara.smartsolarmicrogridmobile.ui.main

import android.content.Intent
import android.os.Bundle
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.lifecycleScope
import com.google.android.material.button.MaterialButton
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.pavanuthsara.smartsolarmicrogridmobile.R
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.ApiResult
import com.pavanuthsara.smartsolarmicrogridmobile.data.repository.ReservationRepository
import com.pavanuthsara.smartsolarmicrogridmobile.data.session.UserSession
import com.pavanuthsara.smartsolarmicrogridmobile.ui.common.endExpiredSession
import com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer.GridMapActivity
import com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer.ProsumerLoginActivity
import com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer.ProsumerProfileActivity
import com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer.ReservationListActivity
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    // Initializes the ViewModel tied to this Activity's lifecycle
    private val testUserViewModel: TestUserViewModel by viewModels()

    private lateinit var userSession: UserSession

    private lateinit var textPendingCount: TextView
    private lateinit var textApprovedCount: TextView
    private lateinit var textTotalCount: TextView

    // Sets up the prosumer home screen.
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        userSession = UserSession(this)

        textPendingCount = findViewById(R.id.textPendingCount)
        textApprovedCount = findViewById(R.id.textApprovedCount)
        textTotalCount = findViewById(R.id.textTotalCount)

        findViewById<MaterialButton>(R.id.buttonProfile).setOnClickListener {
            startActivity(Intent(this, ProsumerProfileActivity::class.java))
        }

        findViewById<MaterialButton>(R.id.buttonReservations).setOnClickListener {
            startActivity(Intent(this, ReservationListActivity::class.java))
        }

        findViewById<MaterialButton>(R.id.buttonGridMap).setOnClickListener {
            startActivity(Intent(this, GridMapActivity::class.java))
        }

        findViewById<MaterialButton>(R.id.buttonLogout).setOnClickListener {
            confirmLogout()
        }
    }

    // Refreshes the reservation counts whenever the screen comes back into view.
    override fun onResume() {
        super.onResume()
        updateDashboardStats()
    }

    // Loads the signed-in prosumer's reservations and shows the counts.
    private fun updateDashboardStats() {
        lifecycleScope.launch {
            val user = userSession.currentUser()
            if (user == null) {
                returnToLogin()
                return@launch
            }

            val repository = ReservationRepository(this@MainActivity)

            // Show what the phone remembers straight away, then replace it with the API's list.
            showCounts(repository.cached().map { it.status })

            when (val result = repository.refresh()) {
                is ApiResult.Success -> showCounts(result.data.map { it.status })
                is ApiResult.Failure -> if (result.sessionExpired) endExpiredSession()
            }
        }
    }

    // Shows the pending, approved and total reservation counts.
    private fun showCounts(statuses: List<String>) {
        val pendingCount = statuses.count { it == "Pending" }
        val approvedCount = statuses.count { it == "Approved" }
        val totalCount = statuses.size

        textPendingCount.text = "Pending Reservations: $pendingCount"
        textApprovedCount.text = "Approved Reservations: $approvedCount"
        textTotalCount.text = "Total Reservations: $totalCount"
    }

    // Asks for confirmation, then signs out and returns to the login screen.
    private fun confirmLogout() {
        MaterialAlertDialogBuilder(this)
            .setTitle("Log Out")
            .setMessage("Are you sure you want to log out?")
            .setPositiveButton("Log Out") { _, _ ->
                lifecycleScope.launch {
                    userSession.signOut()
                    returnToLogin()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    // Opens the login screen and clears the back stack.
    private fun returnToLogin() {
        val intent = Intent(this, ProsumerLoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
}

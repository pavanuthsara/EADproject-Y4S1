package com.pavanuthsara.smartsolarmicrogridmobile.ui.main

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.lifecycleScope
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.pavanuthsara.smartsolarmicrogridmobile.R
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.ApiResult
import com.pavanuthsara.smartsolarmicrogridmobile.data.repository.ReservationRepository
import com.pavanuthsara.smartsolarmicrogridmobile.data.session.UserSession
import com.pavanuthsara.smartsolarmicrogridmobile.ui.common.NavigationUtils
import com.pavanuthsara.smartsolarmicrogridmobile.ui.common.endExpiredSession
import com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer.GridMapActivity
import com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer.ProsumerLoginActivity
import com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer.ProsumerProfileActivity
import com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer.ReservationListActivity
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var userSession: UserSession

    private lateinit var textGreetingName: TextView
    private lateinit var textPendingNumber: TextView
    private lateinit var textApprovedNumber: TextView
    private lateinit var textTotalNumber: TextView
    private lateinit var bottomNavigation: BottomNavigationView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)

        val rootView = findViewById<View>(R.id.main)
        ViewCompat.setOnApplyWindowInsetsListener(rootView) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, 0)
            insets
        }

        userSession = UserSession(this)

        bindViews()
        setupListeners()

        NavigationUtils.setupBottomNav(bottomNavigation, this, R.id.nav_dashboard)
    }

    override fun onResume() {
        super.onResume()
        bottomNavigation.selectedItemId = R.id.nav_dashboard
        updateDashboard()
    }

    private fun bindViews() {
        textGreetingName = findViewById(R.id.textGreetingName)
        textPendingNumber = findViewById(R.id.textPendingNumber)
        textApprovedNumber = findViewById(R.id.textApprovedNumber)
        textTotalNumber = findViewById(R.id.textTotalNumber)
        bottomNavigation = findViewById(R.id.bottomNavigation)
    }

    private fun setupListeners() {
        findViewById<View>(R.id.cardHeroBook).setOnClickListener {
            startActivity(Intent(this, GridMapActivity::class.java))
        }

        findViewById<MaterialButton>(R.id.buttonQuickBook).setOnClickListener {
            startActivity(Intent(this, GridMapActivity::class.java))
        }

        findViewById<MaterialCardView>(R.id.cardNavReservations).setOnClickListener {
            startActivity(Intent(this, ReservationListActivity::class.java))
        }

        findViewById<MaterialCardView>(R.id.cardNavGridMap).setOnClickListener {
            startActivity(Intent(this, GridMapActivity::class.java))
        }

        findViewById<MaterialCardView>(R.id.cardNavProfile).setOnClickListener {
            startActivity(Intent(this, ProsumerProfileActivity::class.java))
        }

        findViewById<MaterialButton>(R.id.buttonLogout).setOnClickListener {
            confirmLogout()
        }
    }

    private fun updateDashboard() {
        lifecycleScope.launch {
            val user = userSession.currentUser()
            if (user == null) {
                returnToLogin()
                return@launch
            }

            val firstName = user.fullName.split(" ").firstOrNull()?.ifBlank { "Prosumer" } ?: "Prosumer"
            textGreetingName.text = "Welcome, $firstName 👋"

            val repository = ReservationRepository(this@MainActivity)

            // Show what the phone remembers straight away, then replace it with the API's list.
            showCounts(repository.cached().map { it.status })

            when (val result = repository.refresh()) {
                is ApiResult.Success -> showCounts(result.data.map { it.status })
                is ApiResult.Failure -> if (result.sessionExpired) endExpiredSession()
            }
        }
    }

    private fun showCounts(statuses: List<String>) {
        val pendingCount = statuses.count { it == "Pending" }
        val approvedCount = statuses.count { it == "Approved" }
        val totalCount = statuses.size

        textPendingNumber.text = pendingCount.toString()
        textApprovedNumber.text = approvedCount.toString()
        textTotalNumber.text = totalCount.toString()
    }

    private fun confirmLogout() {
        MaterialAlertDialogBuilder(this)
            .setTitle("Sign Out")
            .setMessage("Are you sure you want to sign out?")
            .setPositiveButton("Sign Out") { _, _ ->
                lifecycleScope.launch {
                    userSession.signOut()
                    returnToLogin()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun returnToLogin() {
        val intent = Intent(this, ProsumerLoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
}

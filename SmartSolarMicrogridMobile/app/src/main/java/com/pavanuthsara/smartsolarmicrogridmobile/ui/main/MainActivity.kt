package com.pavanuthsara.smartsolarmicrogridmobile.ui.main

import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.pavanuthsara.smartsolarmicrogridmobile.R

class MainActivity : AppCompatActivity() {

    // Initializes the ViewModel tied to this Activity's lifecycle
    private val testUserViewModel: TestUserViewModel by viewModels()

    private lateinit var textPendingCount: android.widget.TextView
    private lateinit var textApprovedCount: android.widget.TextView
    private lateinit var textTotalCount: android.widget.TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        textPendingCount = findViewById(R.id.textPendingCount)
        textApprovedCount = findViewById(R.id.textApprovedCount)
        textTotalCount = findViewById(R.id.textTotalCount)

        findViewById<com.google.android.material.button.MaterialButton>(R.id.buttonProfile).setOnClickListener {
            startActivity(android.content.Intent(this, com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer.ProsumerProfileActivity::class.java))
        }

        findViewById<com.google.android.material.button.MaterialButton>(R.id.buttonReservations).setOnClickListener {
            startActivity(android.content.Intent(this, com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer.ReservationListActivity::class.java))
        }
    }

    override fun onResume() {
        super.onResume()
        updateDashboardStats()
    }

    private fun updateDashboardStats() {
        val sharedPrefs = getSharedPreferences("app_prefs", android.content.Context.MODE_PRIVATE)
        val loggedInNic = sharedPrefs.getString("logged_in_nic", "") ?: ""

        if (loggedInNic.isNotEmpty()) {
            val dao = com.pavanuthsara.smartsolarmicrogridmobile.data.local.AppDatabase.getDatabase(this).reservationDao()
            androidx.lifecycle.lifecycleScope.launchWhenStarted {
                val list = dao.getReservationsByNic(loggedInNic)
                val pendingCount = list.count { it.status == "Pending" }
                val approvedCount = list.count { it.status == "Approved" }
                val totalCount = list.size

                textPendingCount.text = "Pending Reservations: $pendingCount"
                textApprovedCount.text = "Approved Reservations: $approvedCount"
                textTotalCount.text = "Total Reservations: $totalCount"
            }
        }
    }
}
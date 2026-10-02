package com.pavanuthsara.smartsolarmicrogridmobile.ui.main

import android.content.Context
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
import com.pavanuthsara.smartsolarmicrogridmobile.R
import com.pavanuthsara.smartsolarmicrogridmobile.data.local.AppDatabase
import com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer.GridMapActivity
import com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer.ProsumerProfileActivity
import com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer.ReservationListActivity
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    // Initializes the ViewModel tied to this Activity's lifecycle
    private val testUserViewModel: TestUserViewModel by viewModels()

    private lateinit var textPendingCount: TextView
    private lateinit var textApprovedCount: TextView
    private lateinit var textTotalCount: TextView

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

        findViewById<MaterialButton>(R.id.buttonProfile).setOnClickListener {
            startActivity(Intent(this, ProsumerProfileActivity::class.java))
        }

        findViewById<MaterialButton>(R.id.buttonReservations).setOnClickListener {
            startActivity(Intent(this, ReservationListActivity::class.java))
        }

        findViewById<MaterialButton>(R.id.buttonGridMap).setOnClickListener {
            startActivity(Intent(this, GridMapActivity::class.java))
        }
    }

    override fun onResume() {
        super.onResume()
        updateDashboardStats()
    }

    private fun updateDashboardStats() {
        val sharedPrefs = getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        val loggedInNic = sharedPrefs.getString("logged_in_nic", "") ?: ""

        if (loggedInNic.isNotEmpty()) {
            val dao = AppDatabase.getDatabase(this).reservationDao()
            lifecycleScope.launch {
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
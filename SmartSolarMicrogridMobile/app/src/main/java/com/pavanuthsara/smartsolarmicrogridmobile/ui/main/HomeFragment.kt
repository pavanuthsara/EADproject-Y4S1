package com.pavanuthsara.smartsolarmicrogridmobile.ui.main

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.cardview.widget.CardView
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.pavanuthsara.smartsolarmicrogridmobile.R
import com.pavanuthsara.smartsolarmicrogridmobile.data.local.AppDatabase
import com.pavanuthsara.smartsolarmicrogridmobile.data.session.SessionManager
import kotlinx.coroutines.launch
import java.util.Calendar

class HomeFragment : Fragment() {

    private lateinit var textGreeting: TextView
    private lateinit var textPendingCount: TextView
    private lateinit var textApprovedCount: TextView
    private lateinit var textTotalCount: TextView
    private lateinit var cardGoMap: CardView
    private lateinit var cardGoBookings: CardView

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? = inflater.inflate(R.layout.fragment_home, container, false)

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        textGreeting = view.findViewById(R.id.textGreeting)
        textPendingCount = view.findViewById(R.id.textPendingCount)
        textApprovedCount = view.findViewById(R.id.textApprovedCount)
        textTotalCount = view.findViewById(R.id.textTotalCount)
        cardGoMap = view.findViewById(R.id.cardGoMap)
        cardGoBookings = view.findViewById(R.id.cardGoBookings)

        textGreeting.text = buildGreeting()

        // Quick-action cards navigate via the parent MainActivity's nav controller
        cardGoMap.setOnClickListener {
            (activity as? MainActivity)?.navigateTo(R.id.nav_map)
        }
        cardGoBookings.setOnClickListener {
            (activity as? MainActivity)?.navigateTo(R.id.nav_bookings)
        }
    }

    override fun onResume() {
        super.onResume()
        updateDashboardStats()
    }

    private fun updateDashboardStats() {
        // Prefer SessionManager (server-authenticated NIC); fall back to legacy sharedPrefs
        val sessionManager = SessionManager.getInstance(requireContext())
        val loggedInNic = sessionManager.getUserId()
            ?: requireContext()
                .getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
                .getString("logged_in_nic", "") ?: ""

        if (loggedInNic.isNotEmpty()) {
            val dao = AppDatabase.getDatabase(requireContext()).reservationDao()
            lifecycleScope.launch {
                val list = dao.getReservationsByNic(loggedInNic)
                val pendingCount = list.count { it.status == "Pending" }
                val approvedCount = list.count { it.status == "Approved" }
                val totalCount = list.size

                textPendingCount.text = pendingCount.toString()
                textApprovedCount.text = approvedCount.toString()
                textTotalCount.text = totalCount.toString()
            }
        }
    }

    private fun buildGreeting(): String {
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        return when {
            hour < 12 -> "Good Morning ☀️"
            hour < 17 -> "Good Afternoon ⚡"
            else -> "Good Evening 🌙"
        }
    }
}

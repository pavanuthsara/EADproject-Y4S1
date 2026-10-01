package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.ViewGroup.LayoutParams
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.google.android.material.chip.ChipGroup
import com.google.android.material.textfield.TextInputEditText
import com.pavanuthsara.smartsolarmicrogridmobile.R
import com.pavanuthsara.smartsolarmicrogridmobile.data.local.AppDatabase
import com.pavanuthsara.smartsolarmicrogridmobile.data.local.Reservation
import com.pavanuthsara.smartsolarmicrogridmobile.data.session.SessionManager
import kotlinx.coroutines.launch

/**
 * BookingsFragment — shows the full booking history with search + chip filters.
 */
class BookingsFragment : Fragment() {

    private lateinit var editSearch: TextInputEditText
    private lateinit var chipGroupFilter: ChipGroup
    private lateinit var reservationsLayout: LinearLayout

    private var allReservations: List<Reservation> = emptyList()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? = inflater.inflate(R.layout.fragment_bookings, container, false)

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        editSearch        = view.findViewById(R.id.editSearch)
        chipGroupFilter   = view.findViewById(R.id.chipGroupFilter)
        reservationsLayout = view.findViewById(R.id.reservationsLayout)

        editSearch.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) = applyFilters()
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        })

        chipGroupFilter.setOnCheckedStateChangeListener { _, _ -> applyFilters() }
    }

    override fun onResume() {
        super.onResume()
        loadReservations()
    }

    private fun loadReservations() {
        val sessionManager = SessionManager.getInstance(requireContext())
        val loggedInNic = sessionManager.getUserId()
            ?: requireContext()
                .getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
                .getString("logged_in_nic", "") ?: ""

        if (loggedInNic.isEmpty()) return

        val dao = AppDatabase.getDatabase(requireContext()).reservationDao()
        lifecycleScope.launch {
            allReservations = dao.getReservationsByNic(loggedInNic)
            applyFilters()
        }
    }

    private fun applyFilters() {
        val query = editSearch.text?.toString()?.trim()?.lowercase() ?: ""

        val filterLabel = when (chipGroupFilter.checkedChipId) {
            R.id.chipPending  -> "Pending"
            R.id.chipApproved -> "Approved"
            R.id.chipDropoff  -> "Energy Drop-off"
            R.id.chipCharging -> "Energy Charging"
            else              -> "All"
        }

        val filtered = allReservations.filter { res ->
            val matchesQuery  = res.date.lowercase().contains(query)
            val matchesFilter = when (filterLabel) {
                "Pending"        -> res.status == "Pending"
                "Approved"       -> res.status == "Approved"
                "Energy Drop-off"-> res.type   == "Energy Drop-off"
                "Energy Charging"-> res.type   == "Energy Charging"
                else             -> true
            }
            matchesQuery && matchesFilter
        }

        displayList(filtered)
    }

    private fun displayList(list: List<Reservation>) {
        reservationsLayout.removeAllViews()

        if (list.isEmpty()) {
            val emptyText = TextView(requireContext()).apply {
                text      = "No reservations found."
                textSize  = 16f
                setTextColor(Color.GRAY)
                setPadding(0, 32, 0, 0)
            }
            reservationsLayout.addView(emptyText)
            return
        }

        for (res in list) {
            val card = LinearLayout(requireContext()).apply {
                orientation  = LinearLayout.VERTICAL
                setPadding(32, 32, 32, 32)
                setBackgroundColor(Color.parseColor("#F5F5F5"))
                val lp = LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
                lp.setMargins(0, 0, 0, 24)
                layoutParams = lp
            }

            val infoText = TextView(requireContext()).apply {
                text      = "${res.type}\nDate: ${res.date} | Time: ${res.time}\nStatus: ${res.status}"
                textSize  = 15f
                setTextColor(Color.BLACK)
                val lp = LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
                lp.setMargins(0, 0, 0, 16)
                layoutParams = lp
            }

            val actionRow = LinearLayout(requireContext()).apply {
                orientation = LinearLayout.HORIZONTAL
            }

            val btnEdit = Button(requireContext()).apply {
                text = "Edit / Cancel"
                setOnClickListener {
                    val i = Intent(requireContext(), ReservationActivity::class.java)
                    i.putExtra("RESERVATION_ID", res.id)
                    startActivity(i)
                }
            }

            val btnQr = Button(requireContext()).apply {
                text = "View QR"
                setOnClickListener {
                    val i = Intent(requireContext(), ReservationSummaryActivity::class.java)
                    i.putExtra("RESERVATION_ID", res.id)
                    startActivity(i)
                }
            }

            actionRow.addView(btnEdit)
            actionRow.addView(btnQr)
            card.addView(infoText)
            card.addView(actionRow)
            reservationsLayout.addView(card)
        }
    }
}

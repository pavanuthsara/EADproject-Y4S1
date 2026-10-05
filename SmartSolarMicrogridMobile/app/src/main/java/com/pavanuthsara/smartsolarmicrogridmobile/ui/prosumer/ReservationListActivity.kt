package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.view.ViewGroup
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.Spinner
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.google.android.material.button.MaterialButton
import com.pavanuthsara.smartsolarmicrogridmobile.R
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.ApiResult
import com.pavanuthsara.smartsolarmicrogridmobile.data.local.CachedReservation
import com.pavanuthsara.smartsolarmicrogridmobile.data.repository.ReservationRepository
import com.pavanuthsara.smartsolarmicrogridmobile.ui.common.DirectionLabels
import com.pavanuthsara.smartsolarmicrogridmobile.ui.common.DisplayFormats
import com.pavanuthsara.smartsolarmicrogridmobile.ui.common.NavigationUtils
import com.pavanuthsara.smartsolarmicrogridmobile.ui.common.StatusColors
import com.pavanuthsara.smartsolarmicrogridmobile.ui.common.endExpiredSession
import kotlinx.coroutines.launch

// The prosumer's reservations. What the phone remembers is shown at once, then replaced by the
// API's list. Edit and cancel are offered only when the API says the reservation can be changed.
class ReservationListActivity : AppCompatActivity() {

    private lateinit var reservationRepository: ReservationRepository

    private lateinit var reservationsLayout: LinearLayout
    private lateinit var editSearch: EditText
    private lateinit var spinnerFilter: Spinner
    private lateinit var textListStatus: TextView
    private lateinit var bottomNavigation: BottomNavigationView

    private var allReservations: List<CachedReservation> = emptyList()

    // Sets up the reservation list with search and status filtering.
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_reservation_list)

        reservationRepository = ReservationRepository(this)

        reservationsLayout = findViewById(R.id.reservationsLayout)
        editSearch = findViewById(R.id.editSearch)
        spinnerFilter = findViewById(R.id.spinnerFilter)
        textListStatus = findViewById(R.id.textListStatus)
        bottomNavigation = findViewById(R.id.bottomNavigation)

        NavigationUtils.setupBottomNav(bottomNavigation, this, R.id.nav_reservations)

        spinnerFilter.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, FILTERS)

        findViewById<Button>(R.id.buttonNewBooking).setOnClickListener {
            // A booking starts from a station: pick one on the map, then one of its slots.
            startActivity(Intent(this, GridMapActivity::class.java))
        }

        editSearch.addTextChangedListener(object : TextWatcher {
            // Re-filters the list whenever the search text changes.
            override fun afterTextChanged(s: Editable?) { applyFilters() }

            // Not needed; filtering happens after the text changes.
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}

            // Not needed; filtering happens after the text changes.
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        })

        spinnerFilter.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            // Re-filters the list when a status filter is chosen.
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                applyFilters()
            }

            // Nothing to do when no filter is selected.
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
    }

    // Runs every time the screen is shown, so changes made on the web (approved, rejected) appear.
    override fun onResume() {
        super.onResume()
        bottomNavigation.selectedItemId = R.id.nav_reservations
        loadReservations()
    }

    // Shows cached reservations immediately, then refreshes them from the API.
    private fun loadReservations() {
        lifecycleScope.launch {
            allReservations = reservationRepository.cached()
            applyFilters()

            when (val result = reservationRepository.refresh()) {
                is ApiResult.Success -> {
                    allReservations = result.data
                    textListStatus.visibility = View.GONE
                    applyFilters()
                }
                is ApiResult.Failure ->
                    if (result.sessionExpired) {
                        endExpiredSession()
                    } else {
                        textListStatus.text = "${result.message} Showing what was saved on this phone."
                        textListStatus.visibility = View.VISIBLE
                    }
            }
        }
    }

    // Filters reservations by the search text and the chosen status.
    private fun applyFilters() {
        val query = editSearch.text.toString().trim().lowercase()
        val filterSelection = spinnerFilter.selectedItem?.toString() ?: FILTERS[0]

        val filtered = allReservations.filter { res ->
            val matchesQuery = query.isEmpty() ||
                res.stationName.lowercase().contains(query) ||
                res.reservationNo.lowercase().contains(query)
            val matchesFilter = filterSelection == FILTERS[0] || res.status == filterSelection
            matchesQuery && matchesFilter
        }

        displayList(filtered)
    }

    // Shows the reservation cards, or a message when the list is empty.
    private fun displayList(list: List<CachedReservation>) {
        reservationsLayout.removeAllViews()

        if (list.isEmpty()) {
            val emptyText = TextView(this).apply {
                text = if (allReservations.isEmpty()) "You have no reservations yet." else "No reservations match your search."
                textSize = 16f
                setTextColor(ContextCompat.getColor(this@ReservationListActivity, R.color.text_secondary))
                gravity = android.view.Gravity.CENTER
                setPadding(0, 48, 0, 48)
            }
            reservationsLayout.addView(emptyText)
            return
        }

        for (res in list) {
            reservationsLayout.addView(buildCard(res))
        }
    }

    // Builds the card for one reservation.
    private fun buildCard(res: CachedReservation): View {
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(40, 36, 40, 36)
            setBackgroundResource(R.drawable.reservation_card_border)
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply { setMargins(0, 0, 0, 28) }
        }

        val header = TextView(this).apply {
            text = "${res.reservationNo}  |  ${res.status}"
            textSize = 15f
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            setTextColor(StatusColors.of(this@ReservationListActivity, res.status))
        }

        val info = TextView(this).apply {
            text = android.text.SpannableStringBuilder()
                .append("${res.stationName}\n")
                .append("${DisplayFormats.dayAndTimeRange(res.slotStartUtc, res.slotEndUtc)}\n")
                .append(DirectionLabels.withHint(res.direction))
                .append("  |  ${DisplayFormats.kwh(res.requestedKwh)}")
                .also { builder ->
                    if (res.status == "Rejected" && !res.rejectionReason.isNullOrBlank()) {
                        builder.append("\nReason: ${res.rejectionReason}")
                    }
                }
            textSize = 15f
            setTextColor(ContextCompat.getColor(this@ReservationListActivity, R.color.text))
            setLineSpacing(8f, 1f)
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply { setMargins(0, 8, 0, 20) }
        }

        val actionLayout = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }

        // The API's own flags decide whether the booking can still be changed or cancelled.
        if (res.canModify || res.canCancel) {
            actionLayout.addView(MaterialButton(this).apply {
                text = "Edit / Cancel"
                textSize = 13f
                setTextColor(ContextCompat.getColor(this@ReservationListActivity, R.color.text))
                setBackgroundColor(android.graphics.Color.TRANSPARENT)
                strokeWidth = (1.5f * resources.displayMetrics.density).toInt()
                setStrokeColorResource(R.color.outline)
                cornerRadius = (10f * resources.displayMetrics.density).toInt()
                layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
                    marginEnd = 16
                }
                setOnClickListener {
                    val intent = Intent(this@ReservationListActivity, ReservationActivity::class.java)
                    intent.putExtra(ReservationActivity.EXTRA_RESERVATION_ID, res.reservationId)
                    startActivity(intent)
                }
            })
        }

        actionLayout.addView(MaterialButton(this).apply {
            text = if (res.status == "Approved" && !res.qrToken.isNullOrEmpty()) "View QR" else "Details"
            textSize = 13f
            setTextColor(ContextCompat.getColor(this@ReservationListActivity, R.color.on_primary))
            setBackgroundColor(ContextCompat.getColor(this@ReservationListActivity, R.color.primary))
            cornerRadius = (10f * resources.displayMetrics.density).toInt()
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            setOnClickListener {
                val intent = Intent(this@ReservationListActivity, ReservationSummaryActivity::class.java)
                intent.putExtra(ReservationSummaryActivity.EXTRA_RESERVATION_ID, res.reservationId)
                startActivity(intent)
            }
        })

        card.addView(header)
        card.addView(info)
        card.addView(actionLayout)
        return card
    }

    companion object {
        // "All" first; the rest are the statuses the API uses.
        private val FILTERS = arrayOf("All", "Pending", "Approved", "Rejected", "Cancelled", "Completed")
    }
}

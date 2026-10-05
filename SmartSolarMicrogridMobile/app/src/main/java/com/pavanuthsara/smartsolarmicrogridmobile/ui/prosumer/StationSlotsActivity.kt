package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.content.Intent
import android.content.res.ColorStateList
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.lifecycleScope
import com.google.android.material.button.MaterialButton
import com.pavanuthsara.smartsolarmicrogridmobile.R
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.ApiResult
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.SlotDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.repository.StationRepository
import com.pavanuthsara.smartsolarmicrogridmobile.ui.common.DirectionLabels
import com.pavanuthsara.smartsolarmicrogridmobile.ui.common.DisplayFormats
import com.pavanuthsara.smartsolarmicrogridmobile.ui.common.endExpiredSession
import kotlinx.coroutines.launch

// The bookable slots of one station, grouped by day. The API only sends slots a prosumer can
// still book (open, in the future, inside the booking window); full ones are shown greyed out.
class StationSlotsActivity : AppCompatActivity() {

    private lateinit var stationRepository: StationRepository
    private lateinit var stationId: String
    private lateinit var stationName: String

    private lateinit var slotsContainer: LinearLayout
    private lateinit var progressSlots: ProgressBar
    private lateinit var textSlotsMessage: TextView
    private lateinit var buttonRetrySlots: MaterialButton

    // Sets up the screen listing a station's bookable slots.
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_station_slots)

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.slotsRoot)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        stationId = intent.getStringExtra(EXTRA_STATION_ID).orEmpty()
        stationName = intent.getStringExtra(EXTRA_STATION_NAME).orEmpty()
        if (stationId.isEmpty()) {
            finish()
            return
        }

        stationRepository = StationRepository(this)
        slotsContainer = findViewById(R.id.slotsContainer)
        progressSlots = findViewById(R.id.progressSlots)
        textSlotsMessage = findViewById(R.id.textSlotsMessage)
        buttonRetrySlots = findViewById(R.id.buttonRetrySlots)

        findViewById<TextView>(R.id.textStationTitle).text = stationName
        buttonRetrySlots.setOnClickListener { loadSlots() }
    }

    // Reloaded every time the screen is shown, so a slot someone else just filled disappears or greys out.
    override fun onResume() {
        super.onResume()
        loadSlots()
    }

    // Loads the station's slots from the API.
    private fun loadSlots() {
        progressSlots.visibility = View.VISIBLE
        textSlotsMessage.visibility = View.GONE
        buttonRetrySlots.visibility = View.GONE

        lifecycleScope.launch {
            when (val result = stationRepository.slots(stationId)) {
                is ApiResult.Success -> showSlots(result.data)
                is ApiResult.Failure ->
                    if (result.sessionExpired) {
                        endExpiredSession()
                    } else {
                        slotsContainer.removeAllViews()
                        progressSlots.visibility = View.GONE
                        textSlotsMessage.text = result.message
                        textSlotsMessage.visibility = View.VISIBLE
                        buttonRetrySlots.visibility = View.VISIBLE
                    }
            }
        }
    }

    // Shows a card for each slot, or a message when there are none.
    private fun showSlots(slots: List<SlotDto>) {
        progressSlots.visibility = View.GONE
        slotsContainer.removeAllViews()

        if (slots.isEmpty()) {
            textSlotsMessage.text = getString(R.string.no_slots_available)
            textSlotsMessage.visibility = View.VISIBLE
            return
        }
        textSlotsMessage.visibility = View.GONE

        val inflater = LayoutInflater.from(this)
        var lastDay = ""
        for (slot in slots) {
            val day = DisplayFormats.dayKey(slot.startTime)
            if (day != lastDay) {
                lastDay = day
                val heading = inflater.inflate(R.layout.item_day_heading, slotsContainer, false) as TextView
                heading.text = DisplayFormats.day(slot.startTime)
                slotsContainer.addView(heading)
            }
            slotsContainer.addView(buildSlotCard(inflater, slot))
        }
    }

    // Builds the card for one slot, showing its time and whether it is full.
    private fun buildSlotCard(inflater: LayoutInflater, slot: SlotDto): View {
        val card = inflater.inflate(R.layout.item_slot, slotsContainer, false)

        card.findViewById<TextView>(R.id.textSlotTime).text = DisplayFormats.timeRange(slot.startTime, slot.endTime)

        val state = card.findViewById<TextView>(R.id.textSlotState)
        state.text = if (slot.isFull) "FULL" else "OPEN"
        state.setTextColor(
            ContextCompat.getColor(this, if (slot.isFull) R.color.status_pending else R.color.status_approved)
        )

        val percent = if (slot.capacityKwh > 0) ((slot.reservedKwh / slot.capacityKwh) * 100).toInt().coerceIn(0, 100) else 0
        val battery = card.findViewById<ProgressBar>(R.id.progressSlotEnergy)
        battery.progress = percent
        battery.progressTintList = ColorStateList.valueOf(
            ContextCompat.getColor(
                this,
                when {
                    slot.isFull || percent >= 90 -> R.color.status_error
                    percent >= 60 -> R.color.status_pending
                    else -> R.color.status_approved
                }
            )
        )

        card.findViewById<TextView>(R.id.textSlotEnergy).text =
            "${DisplayFormats.kwh(slot.freeKwh)} free of ${DisplayFormats.kwh(slot.capacityKwh)}"
        card.findViewById<TextView>(R.id.textSlotBays).text =
            "${slot.freePositions} of ${slot.totalPositions} bays free"

        // The allowed directions, each with the API word as a small hint.
        val directions = card.findViewById<TextView>(R.id.textSlotDirections)
        directions.text = ""
        slot.directions.forEachIndexed { index, direction ->
            if (index > 0) directions.append("  |  ")
            directions.append(DirectionLabels.withHint(direction))
        }

        val book = card.findViewById<MaterialButton>(R.id.buttonBookSlot)
        if (slot.isFull) {
            book.isEnabled = false
            book.text = "Slot is full"
        } else {
            book.setOnClickListener {
                val intent = Intent(this, ReservationActivity::class.java)
                intent.putExtra(ReservationActivity.EXTRA_STATION_ID, stationId)
                intent.putExtra(ReservationActivity.EXTRA_STATION_NAME, stationName)
                intent.putExtra(ReservationActivity.EXTRA_SLOT_ID, slot.id)
                startActivity(intent)
            }
        }

        return card
    }

    companion object {
        const val EXTRA_STATION_ID = "STATION_ID"
        const val EXTRA_STATION_NAME = "STATION_NAME"
    }
}

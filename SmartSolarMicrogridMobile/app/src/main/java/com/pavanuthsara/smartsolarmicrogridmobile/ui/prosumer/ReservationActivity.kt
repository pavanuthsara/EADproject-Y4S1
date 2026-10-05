package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.ProgressBar
import android.widget.RadioButton
import android.widget.RadioGroup
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.google.android.material.button.MaterialButton
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.textfield.TextInputLayout
import com.pavanuthsara.smartsolarmicrogridmobile.R
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.SlotDto
import com.pavanuthsara.smartsolarmicrogridmobile.ui.common.DirectionLabels
import com.pavanuthsara.smartsolarmicrogridmobile.ui.common.DisplayFormats
import com.pavanuthsara.smartsolarmicrogridmobile.ui.common.endExpiredSession

// Books a slot at a station, or changes / cancels an existing reservation. Every rule (booking
// window, notice period, capacity, duplicates) is checked by the API; this screen only collects the
// slot, direction and kWh and shows the API's answer.
class ReservationActivity : AppCompatActivity() {

    private val viewModel: ReservationViewModel by viewModels()

    private lateinit var textTitle: TextView
    private lateinit var textStationName: TextView
    private lateinit var progressForm: ProgressBar
    private lateinit var textFormMessage: TextView
    private lateinit var formContent: View
    private lateinit var spinnerSlot: Spinner
    private lateinit var textSlotInfo: TextView
    private lateinit var radioDirections: RadioGroup
    private lateinit var inputKwh: TextInputLayout
    private lateinit var buttonBook: MaterialButton
    private lateinit var buttonCancel: MaterialButton

    private var slots: List<SlotDto> = emptyList()
    private var preferredDirection: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_reservation)

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.reservationRoot)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        textTitle = findViewById(R.id.textViewTitle)
        textStationName = findViewById(R.id.textStationName)
        progressForm = findViewById(R.id.progressForm)
        textFormMessage = findViewById(R.id.textFormMessage)
        formContent = findViewById(R.id.formContent)
        spinnerSlot = findViewById(R.id.spinnerSlot)
        textSlotInfo = findViewById(R.id.textSlotInfo)
        radioDirections = findViewById(R.id.radioDirections)
        inputKwh = findViewById(R.id.inputKwh)
        buttonBook = findViewById(R.id.buttonBook)
        buttonCancel = findViewById(R.id.buttonCancel)

        val reservationId = intent.getStringExtra(EXTRA_RESERVATION_ID)
        val isEditing = reservationId != null
        textTitle.text = if (isEditing) "Update Booking" else "Book a Slot"
        buttonBook.text = if (isEditing) "Save Changes" else "Confirm Booking"

        spinnerSlot.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                slots.getOrNull(position)?.let { showSlot(it) }
            }

            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }

        buttonBook.setOnClickListener { submit() }
        buttonCancel.setOnClickListener { confirmCancel() }

        observeViewModel()

        viewModel.load(
            stationIdExtra = intent.getStringExtra(EXTRA_STATION_ID),
            stationNameExtra = intent.getStringExtra(EXTRA_STATION_NAME),
            slotId = intent.getStringExtra(EXTRA_SLOT_ID),
            reservationId = reservationId
        )
    }

    private fun observeViewModel() {
        viewModel.state.observe(this) { state ->
            when (state) {
                is FormState.Loading -> {
                    progressForm.visibility = View.VISIBLE
                    formContent.visibility = View.GONE
                    textFormMessage.visibility = View.GONE
                }
                is FormState.LoadError -> {
                    progressForm.visibility = View.GONE
                    formContent.visibility = View.GONE
                    textFormMessage.text = state.message
                    textFormMessage.visibility = View.VISIBLE
                }
                is FormState.Ready -> {
                    progressForm.visibility = View.GONE
                    textFormMessage.visibility = View.GONE
                    formContent.visibility = View.VISIBLE
                    showForm(state)
                }
            }
        }

        viewModel.busy.observe(this) { busy ->
            buttonBook.isEnabled = !busy
            buttonCancel.isEnabled = !busy
        }

        viewModel.event.observe(this) { wrapped ->
            when (val event = wrapped.consume()) {
                is FormEvent.Saved -> {
                    val intent = Intent(this, ReservationSummaryActivity::class.java)
                    intent.putExtra(ReservationSummaryActivity.EXTRA_RESERVATION_ID, event.reservationId)
                    intent.putExtra(ReservationSummaryActivity.EXTRA_MESSAGE, event.message)
                    startActivity(intent)
                    finish()
                }
                is FormEvent.Cancelled -> {
                    Toast.makeText(this, event.message, Toast.LENGTH_LONG).show()
                    finish()
                }
                is FormEvent.Failed -> Toast.makeText(this, event.message, Toast.LENGTH_LONG).show()
                is FormEvent.SessionExpired -> endExpiredSession()
                null -> Unit
            }
        }
    }

    private fun showForm(state: FormState.Ready) {
        textStationName.text = state.stationName
        slots = state.slots

        if (slots.isEmpty()) {
            formContent.visibility = View.GONE
            textFormMessage.text = getString(R.string.no_slots_available)
            textFormMessage.visibility = View.VISIBLE
            return
        }

        spinnerSlot.adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_dropdown_item,
            slots.map { DisplayFormats.dayAndTimeRange(it.startTime, it.endTime) }
        )
        val selectedIndex = slots.indexOfFirst { it.id == state.selectedSlotId }.coerceAtLeast(0)

        val existing = state.existing
        if (existing != null) {
            preferredDirection = existing.direction
            val kwhField = inputKwh.editText
            if (kwhField != null && kwhField.text.isNullOrEmpty()) {
                kwhField.setText(DisplayFormats.kwh(existing.requestedKwh).removeSuffix(" kWh"))
            }
            buttonCancel.visibility = if (existing.canCancel) View.VISIBLE else View.GONE

            // The API's own flags say whether the booking can still be changed.
            if (!existing.canModify) {
                buttonBook.visibility = View.GONE
                textFormMessage.text = getString(R.string.reservation_locked)
                textFormMessage.visibility = View.VISIBLE
                spinnerSlot.isEnabled = false
                inputKwh.isEnabled = false
            }
        }

        spinnerSlot.setSelection(selectedIndex)
        showSlot(slots[selectedIndex])
    }

    // Lists only the directions this slot accepts, and shows how much room it has left.
    private fun showSlot(slot: SlotDto) {
        val chosen = selectedDirection() ?: preferredDirection

        textSlotInfo.text = if (slot.capacityKwh > 0) {
            "${DisplayFormats.kwh(slot.freeKwh)} and ${slot.freePositions} bays free in this slot"
        } else {
            "Your current slot"
        }

        radioDirections.removeAllViews()
        val canEdit = viewModel.state.value.let { it !is FormState.Ready || it.existing?.canModify != false }
        slot.directions.forEach { direction ->
            val radio = RadioButton(this).apply {
                id = View.generateViewId()
                text = DirectionLabels.withHint(direction)
                tag = direction
                textSize = 16f
                isEnabled = canEdit
            }
            radioDirections.addView(radio)
            if (direction == chosen) radio.isChecked = true
        }
        if (radioDirections.checkedRadioButtonId == -1 && radioDirections.childCount > 0) {
            (radioDirections.getChildAt(0) as RadioButton).isChecked = true
        }
    }

    private fun selectedDirection(): String? {
        val checkedId = radioDirections.checkedRadioButtonId
        if (checkedId == -1) return null
        return radioDirections.findViewById<RadioButton>(checkedId)?.tag as? String
    }

    private fun submit() {
        val slot = slots.getOrNull(spinnerSlot.selectedItemPosition)
        val direction = selectedDirection()
        val kwh = inputKwh.editText?.text?.toString()?.trim()?.toDoubleOrNull()

        // Only the quickest checks are made here, to save a round trip; the API checks everything else.
        inputKwh.error = if (kwh == null || kwh <= 0.0) "Enter an energy amount above 0" else null
        if (slot == null || direction == null || kwh == null || kwh <= 0.0) return

        if (intent.getStringExtra(EXTRA_RESERVATION_ID) != null) {
            viewModel.saveChanges(slot.id, direction, kwh)
        } else {
            viewModel.book(slot.id, direction, kwh)
        }
    }

    private fun confirmCancel() {
        MaterialAlertDialogBuilder(this)
            .setTitle("Cancel Reservation")
            .setMessage("Are you sure you want to cancel this reservation?")
            .setPositiveButton("Yes") { _, _ -> viewModel.cancelReservation() }
            .setNegativeButton("No", null)
            .show()
    }

    companion object {
        const val EXTRA_STATION_ID = "STATION_ID"
        const val EXTRA_STATION_NAME = "STATION_NAME"
        const val EXTRA_SLOT_ID = "SLOT_ID"
        const val EXTRA_RESERVATION_ID = "RESERVATION_ID"
    }
}

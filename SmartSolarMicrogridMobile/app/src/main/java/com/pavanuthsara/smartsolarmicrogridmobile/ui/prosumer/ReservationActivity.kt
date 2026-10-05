package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.ArrayAdapter
import android.widget.Spinner
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.lifecycleScope
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.TextInputLayout
import com.pavanuthsara.smartsolarmicrogridmobile.R
import com.pavanuthsara.smartsolarmicrogridmobile.data.session.UserSession
import kotlinx.coroutines.launch

class ReservationActivity : AppCompatActivity() {

    private val viewModel: ReservationViewModel by viewModels()

    private lateinit var spinnerType: Spinner
    private lateinit var inputDate: TextInputLayout
    private lateinit var inputTime: TextInputLayout
    private lateinit var buttonCancel: MaterialButton

    private var loggedInNic: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_reservation)

        val rootView = findViewById<View>(R.id.reservationRoot)
        ViewCompat.setOnApplyWindowInsetsListener(rootView) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        spinnerType = findViewById(R.id.spinnerType)
        inputDate = findViewById(R.id.inputDate)
        inputTime = findViewById(R.id.inputTime)
        buttonCancel = findViewById(R.id.buttonCancel)

        val types = arrayOf("Energy Drop-off", "Energy Charging")
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, types)
        spinnerType.adapter = adapter

        lifecycleScope.launch {
            val user = UserSession(this@ReservationActivity).currentUser()
            if (user == null) {
                Toast.makeText(this@ReservationActivity, "Please log in first", Toast.LENGTH_SHORT).show()
                finish()
            } else {
                loggedInNic = user.nic
            }
        }

        val reservationId = intent.getLongExtra("RESERVATION_ID", -1)
        if (reservationId != -1L) {
            viewModel.loadReservation(reservationId)
            buttonCancel.visibility = View.VISIBLE
        }

        findViewById<MaterialButton>(R.id.buttonBook).setOnClickListener {
            attemptSave()
        }

        buttonCancel.setOnClickListener {
            AlertDialog.Builder(this)
                .setTitle("Cancel Reservation")
                .setMessage("Are you sure you want to cancel this reservation?")
                .setPositiveButton("Yes") { _, _ -> viewModel.cancelReservation() }
                .setNegativeButton("No", null)
                .show()
        }

        viewModel.status.observe(this) { status ->
            when (status) {
                is ReservationStatus.Loaded -> {
                    val pos = types.indexOf(status.reservation.type)
                    if (pos >= 0) spinnerType.setSelection(pos)
                    inputDate.editText?.setText(status.reservation.date)
                    inputTime.editText?.setText(status.reservation.time)
                }
                is ReservationStatus.Success -> {
                    Toast.makeText(this, "Reservation Saved!", Toast.LENGTH_SHORT).show()
                    val intent = Intent(this, ReservationSummaryActivity::class.java)
                    intent.putExtra("RESERVATION_ID", status.reservationId)
                    startActivity(intent)
                    finish()
                }
                is ReservationStatus.Deleted -> {
                    Toast.makeText(this, "Reservation Cancelled", Toast.LENGTH_SHORT).show()
                    finish()
                }
                is ReservationStatus.Error -> {
                    Toast.makeText(this, status.message, Toast.LENGTH_LONG).show()
                }
                else -> Unit
            }
        }
    }

    private fun attemptSave() {
        if (loggedInNic.isEmpty()) return

        val type = spinnerType.selectedItem.toString()
        val date = inputDate.editText?.text?.toString()?.trim().orEmpty()
        val time = inputTime.editText?.text?.toString()?.trim().orEmpty()

        inputDate.error = if (date.isEmpty()) "Date is required" else null
        inputTime.error = if (time.isEmpty()) "Time is required" else null

        if (date.isNotEmpty() && time.isNotEmpty()) {
            viewModel.saveReservation(loggedInNic, type, date, time)
        }
    }
}

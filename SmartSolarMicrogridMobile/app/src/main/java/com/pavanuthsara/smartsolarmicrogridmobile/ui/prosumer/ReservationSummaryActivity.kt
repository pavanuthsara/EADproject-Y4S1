package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.os.Bundle
import android.view.View
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.lifecycleScope
import com.google.android.material.button.MaterialButton
import com.pavanuthsara.smartsolarmicrogridmobile.R
import com.pavanuthsara.smartsolarmicrogridmobile.data.local.CachedReservation
import com.pavanuthsara.smartsolarmicrogridmobile.data.repository.ReservationRepository
import com.pavanuthsara.smartsolarmicrogridmobile.ui.common.DirectionLabels
import com.pavanuthsara.smartsolarmicrogridmobile.ui.common.DisplayFormats
import com.pavanuthsara.smartsolarmicrogridmobile.ui.common.QrCodes
import com.pavanuthsara.smartsolarmicrogridmobile.ui.common.StatusColors
import kotlinx.coroutines.launch

// Shows one reservation as the API last reported it: after booking, after a change, and from the list.
// An Approved reservation also shows its QR code, drawn from the token the API sends. The Grid Operator
// scans it to verify the booking.
class ReservationSummaryActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_reservation_summary)

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.summaryRoot)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        findViewById<MaterialButton>(R.id.buttonDone).setOnClickListener { finish() }

        val reservationId = intent.getStringExtra(EXTRA_RESERVATION_ID)
        if (reservationId == null) {
            Toast.makeText(this, "Invalid reservation", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        val repository = ReservationRepository(this)
        lifecycleScope.launch {
            val reservation = repository.cachedById(reservationId)
            if (reservation == null) {
                Toast.makeText(this@ReservationSummaryActivity, "Reservation not found", Toast.LENGTH_SHORT).show()
                finish()
                return@launch
            }
            show(reservation, intent.getStringExtra(EXTRA_MESSAGE))

            // Staff may have approved it since it was last downloaded, which is when the QR code appears.
            repository.refresh()
            repository.cachedById(reservationId)?.let { show(it, intent.getStringExtra(EXTRA_MESSAGE)) }
        }
    }

    private fun show(reservation: CachedReservation, apiMessage: String?) {
        findViewById<TextView>(R.id.textReservationNo).text = reservation.reservationNo

        val status = findViewById<TextView>(R.id.textStatus)
        status.text = reservation.status
        status.setTextColor(StatusColors.of(this, reservation.status))

        findViewById<TextView>(R.id.textStation).text = reservation.stationName
        findViewById<TextView>(R.id.textSlotTime).text =
            DisplayFormats.dayAndTimeRange(reservation.slotStartUtc, reservation.slotEndUtc)
        findViewById<TextView>(R.id.textDirection).text = DirectionLabels.withHint(reservation.direction)
        findViewById<TextView>(R.id.textKwh).text = DisplayFormats.kwh(reservation.requestedKwh)

        val message = findViewById<TextView>(R.id.textApiMessage)
        if (!apiMessage.isNullOrBlank()) {
            message.text = apiMessage
            message.visibility = View.VISIBLE
        }

        // Only an Approved reservation has a QR code; the API sends the token for no other status.
        val cardQr = findViewById<View>(R.id.cardQr)
        val qrBitmap = reservation.qrToken
            ?.takeIf { reservation.status == "Approved" }
            ?.let { QrCodes.generate(it) }
        if (qrBitmap != null) {
            findViewById<ImageView>(R.id.imageQrCode).setImageBitmap(qrBitmap)
            cardQr.visibility = View.VISIBLE
        } else {
            cardQr.visibility = View.GONE
        }

        findViewById<TextView>(R.id.textStatusHint).text = when (reservation.status) {
            "Pending" -> getString(R.string.hint_pending)
            "Approved" -> getString(if (qrBitmap != null) R.string.hint_approved else R.string.hint_approved_no_qr)
            "Rejected" -> reservation.rejectionReason?.let { "Reason: $it" } ?: getString(R.string.hint_rejected)
            "Cancelled" -> getString(R.string.hint_cancelled)
            else -> ""
        }
    }

    companion object {
        const val EXTRA_RESERVATION_ID = "RESERVATION_ID"
        const val EXTRA_MESSAGE = "MESSAGE"
    }
}

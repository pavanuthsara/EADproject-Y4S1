package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.graphics.Bitmap
import android.graphics.Color
import android.os.Bundle
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.google.android.material.button.MaterialButton
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import com.pavanuthsara.smartsolarmicrogridmobile.R

class ReservationSummaryActivity : AppCompatActivity() {

    private val viewModel: ReservationViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_reservation_summary)

        val rootView = findViewById<android.view.View>(R.id.summaryRoot)
        ViewCompat.setOnApplyWindowInsetsListener(rootView) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        val textType = findViewById<TextView>(R.id.textType)
        val textDateTime = findViewById<TextView>(R.id.textDateTime)
        val imageQrCode = findViewById<ImageView>(R.id.imageQrCode)
        val buttonDone = findViewById<MaterialButton>(R.id.buttonDone)

        buttonDone.setOnClickListener {
            finish() // Return to dashboard
        }

        val reservationId = intent.getLongExtra("RESERVATION_ID", -1)
        if (reservationId == -1L) {
            Toast.makeText(this, "Invalid reservation", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        viewModel.loadReservation(reservationId)

        viewModel.status.observe(this) { status ->
            if (status is ReservationStatus.Loaded) {
                val res = status.reservation
                textType.text = res.type
                textDateTime.text = "${res.date} at ${res.time}"

                res.qrCodeData?.let { qrData ->
                    val bitmap = generateQrCode(qrData)
                    if (bitmap != null) {
                        imageQrCode.setImageBitmap(bitmap)
                    }
                }
            } else if (status is ReservationStatus.Error) {
                Toast.makeText(this, status.message, Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun generateQrCode(content: String): Bitmap? {
        return try {
            val writer = QRCodeWriter()
            val bitMatrix = writer.encode(content, BarcodeFormat.QR_CODE, 512, 512)
            val width = bitMatrix.width
            val height = bitMatrix.height
            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.RGB_565)
            for (x in 0 until width) {
                for (y in 0 until height) {
                    bitmap.setPixel(x, y, if (bitMatrix.get(x, y)) Color.BLACK else Color.WHITE)
                }
            }
            bitmap
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}

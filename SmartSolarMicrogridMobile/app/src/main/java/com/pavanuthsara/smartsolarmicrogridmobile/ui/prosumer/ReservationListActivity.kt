package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.pavanuthsara.smartsolarmicrogridmobile.R
import com.pavanuthsara.smartsolarmicrogridmobile.data.local.AppDatabase
import kotlinx.coroutines.launch

class ReservationListActivity : AppCompatActivity() {

    private lateinit var reservationsLayout: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_reservation_list)

        reservationsLayout = findViewById(R.id.reservationsLayout)

        findViewById<Button>(R.id.buttonNewBooking).setOnClickListener {
            startActivity(Intent(this, ReservationActivity::class.java))
        }
    }

    override fun onResume() {
        super.onResume()
        loadReservations()
    }

    private fun loadReservations() {
        val sharedPrefs = getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        val loggedInNic = sharedPrefs.getString("logged_in_nic", "") ?: ""

        if (loggedInNic.isEmpty()) return

        val dao = AppDatabase.getDatabase(this).reservationDao()
        
        lifecycleScope.launch {
            val list = dao.getReservationsByNic(loggedInNic)
            reservationsLayout.removeAllViews()

            if (list.isEmpty()) {
                val emptyText = TextView(this@ReservationListActivity).apply {
                    text = "No reservations found."
                    textSize = 16f
                }
                reservationsLayout.addView(emptyText)
            } else {
                for (res in list) {
                    val card = LinearLayout(this@ReservationListActivity).apply {
                        orientation = LinearLayout.VERTICAL
                        setPadding(32, 32, 32, 32)
                        setBackgroundColor(Color.parseColor("#F5F5F5"))
                        layoutParams = LinearLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.WRAP_CONTENT
                        ).apply { setMargins(0, 0, 0, 32) }
                    }

                    val infoText = TextView(this@ReservationListActivity).apply {
                        text = "${res.type}\nDate: ${res.date} | Time: ${res.time}\nStatus: ${res.status}"
                        textSize = 16f
                        setTextColor(Color.BLACK)
                        layoutParams = LinearLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.WRAP_CONTENT
                        ).apply { setMargins(0, 0, 0, 16) }
                    }

                    val actionLayout = LinearLayout(this@ReservationListActivity).apply {
                        orientation = LinearLayout.HORIZONTAL
                    }

                    val btnEdit = Button(this@ReservationListActivity).apply {
                        text = "Edit/Cancel"
                        setOnClickListener {
                            val intent = Intent(this@ReservationListActivity, ReservationActivity::class.java)
                            intent.putExtra("RESERVATION_ID", res.id)
                            startActivity(intent)
                        }
                    }

                    val btnQr = Button(this@ReservationListActivity).apply {
                        text = "View QR"
                        setOnClickListener {
                            val intent = Intent(this@ReservationListActivity, ReservationSummaryActivity::class.java)
                            intent.putExtra("RESERVATION_ID", res.id)
                            startActivity(intent)
                        }
                    }

                    actionLayout.addView(btnEdit)
                    actionLayout.addView(btnQr)
                    card.addView(infoText)
                    card.addView(actionLayout)
                    reservationsLayout.addView(card)
                }
            }
        }
    }
}

package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.content.Context
import android.content.Intent
import android.graphics.Color
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
import androidx.lifecycle.lifecycleScope
import com.pavanuthsara.smartsolarmicrogridmobile.R
import com.pavanuthsara.smartsolarmicrogridmobile.data.local.AppDatabase
import com.pavanuthsara.smartsolarmicrogridmobile.data.local.Reservation
import kotlinx.coroutines.launch

class ReservationListActivity : AppCompatActivity() {

    private lateinit var reservationsLayout: LinearLayout
    private lateinit var editSearch: EditText
    private lateinit var spinnerFilter: Spinner

    private var allReservations: List<Reservation> = emptyList()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_reservation_list)

        reservationsLayout = findViewById(R.id.reservationsLayout)
        editSearch = findViewById(R.id.editSearch)
        spinnerFilter = findViewById(R.id.spinnerFilter)

        val filters = arrayOf("All", "Pending", "Approved", "Energy Drop-off", "Energy Charging")
        spinnerFilter.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, filters)

        findViewById<Button>(R.id.buttonNewBooking).setOnClickListener {
            startActivity(Intent(this, ReservationActivity::class.java))
        }

        editSearch.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) { applyFilters() }
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        })

        spinnerFilter.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                applyFilters()
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
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
            allReservations = dao.getReservationsByNic(loggedInNic)
            applyFilters()
        }
    }

    private fun applyFilters() {
        val query = editSearch.text.toString().trim().lowercase()
        val filterSelection = spinnerFilter.selectedItem.toString()

        val filtered = allReservations.filter { res ->
            val matchesQuery = res.date.lowercase().contains(query)
            val matchesFilter = when (filterSelection) {
                "Pending" -> res.status == "Pending"
                "Approved" -> res.status == "Approved"
                "Energy Drop-off" -> res.type == "Energy Drop-off"
                "Energy Charging" -> res.type == "Energy Charging"
                else -> true
            }
            matchesQuery && matchesFilter
        }

        displayList(filtered)
    }

    private fun displayList(list: List<Reservation>) {
        reservationsLayout.removeAllViews()

        if (list.isEmpty()) {
            val emptyText = TextView(this).apply {
                text = "No reservations found."
                textSize = 16f
            }
            reservationsLayout.addView(emptyText)
        } else {
            for (res in list) {
                val card = LinearLayout(this).apply {
                    orientation = LinearLayout.VERTICAL
                    setPadding(32, 32, 32, 32)
                    setBackgroundColor(Color.parseColor("#F5F5F5"))
                    layoutParams = LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                    ).apply { setMargins(0, 0, 0, 32) }
                }

                val infoText = TextView(this).apply {
                    text = "${res.type}\nDate: ${res.date} | Time: ${res.time}\nStatus: ${res.status}"
                    textSize = 16f
                    setTextColor(Color.BLACK)
                    layoutParams = LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                    ).apply { setMargins(0, 0, 0, 16) }
                }

                val actionLayout = LinearLayout(this).apply {
                    orientation = LinearLayout.HORIZONTAL
                }

                val btnEdit = Button(this).apply {
                    text = "Edit/Cancel"
                    setOnClickListener {
                        val intent = Intent(this@ReservationListActivity, ReservationActivity::class.java)
                        intent.putExtra("RESERVATION_ID", res.id)
                        startActivity(intent)
                    }
                }

                val btnQr = Button(this).apply {
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

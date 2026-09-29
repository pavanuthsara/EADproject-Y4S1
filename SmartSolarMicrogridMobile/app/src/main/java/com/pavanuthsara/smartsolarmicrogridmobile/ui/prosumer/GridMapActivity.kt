package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.cardview.widget.CardView
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.MarkerOptions
import com.google.android.material.button.MaterialButton
import com.pavanuthsara.smartsolarmicrogridmobile.R

data class GridNode(val id: String, val name: String, val lat: Double, val lng: Double, val status: String, val capacity: String)

class GridMapActivity : AppCompatActivity(), OnMapReadyCallback {

    private lateinit var mMap: GoogleMap
    private lateinit var cardStationDetails: CardView
    private lateinit var textStationName: TextView
    private lateinit var textStationDetails: TextView
    private lateinit var buttonBookStation: MaterialButton

    private val mockNodes = listOf(
        GridNode("N1", "Central Solar Node", 6.9271, 79.8612, "Active", "120kW"), // Colombo area mock
        GridNode("N2", "South Wing Station", 6.9150, 79.8650, "Maintenance", "0kW"),
        GridNode("N3", "North East Grid", 6.9350, 79.8700, "Active", "80kW")
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_grid_map)

        cardStationDetails = findViewById(R.id.cardStationDetails)
        textStationName = findViewById(R.id.textStationName)
        textStationDetails = findViewById(R.id.textStationDetails)
        buttonBookStation = findViewById(R.id.buttonBookStation)

        val mapFragment = supportFragmentManager.findFragmentById(R.id.map) as SupportMapFragment
        mapFragment.getMapAsync(this)

        buttonBookStation.setOnClickListener {
            // Take user to the reservation screen
            startActivity(Intent(this, ReservationActivity::class.java))
        }
    }

    override fun onMapReady(googleMap: GoogleMap) {
        mMap = googleMap

        // Plot nodes
        for (node in mockNodes) {
            val position = LatLng(node.lat, node.lng)
            val marker = mMap.addMarker(
                MarkerOptions()
                    .position(position)
                    .title(node.name)
            )
            marker?.tag = node
        }

        // Center map on the first node
        val firstNode = LatLng(mockNodes[0].lat, mockNodes[0].lng)
        mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(firstNode, 13f))

        mMap.setOnMarkerClickListener { marker ->
            val node = marker.tag as? GridNode
            if (node != null) {
                textStationName.text = node.name
                textStationDetails.text = "Status: ${node.status}\nAvailable Capacity: ${node.capacity}"
                
                // Disable booking if maintenance
                buttonBookStation.isEnabled = node.status == "Active"
                
                cardStationDetails.visibility = View.VISIBLE
            }
            false // return false so the default behavior (showing info window) still occurs if they want
        }

        mMap.setOnMapClickListener {
            cardStationDetails.visibility = View.GONE
        }
    }
}

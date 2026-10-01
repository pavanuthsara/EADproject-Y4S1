package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.cardview.widget.CardView
import androidx.fragment.app.Fragment
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.MarkerOptions
import com.google.android.material.button.MaterialButton
import android.widget.TextView
import com.pavanuthsara.smartsolarmicrogridmobile.R

/**
 * Prosumer Map Fragment — plots nearby microgrid nodes using Google Maps.
 * Tapping a marker shows station details; "Book This Station" launches ReservationActivity.
 */
class ProsumerMapFragment : Fragment(), OnMapReadyCallback {

    private lateinit var mMap: GoogleMap
    private lateinit var cardStationDetails: CardView
    private lateinit var textStationName: TextView
    private lateinit var textStationStatus: TextView
    private lateinit var textStationCapacity: TextView
    private lateinit var buttonBookStation: MaterialButton

    // Static mock nodes (replace with API call when backend endpoint is ready)
    private val gridNodes = listOf(
        GridNode("N1", "Central Solar Node",  6.9271, 79.8612, "Active",      "120kW"),
        GridNode("N2", "South Wing Station",  6.9150, 79.8650, "Maintenance", "0kW"),
        GridNode("N3", "North East Grid",     6.9350, 79.8700, "Active",      "80kW")
    )

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? = inflater.inflate(R.layout.fragment_prosumer_map, container, false)

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        cardStationDetails = view.findViewById(R.id.cardStationDetails)
        textStationName    = view.findViewById(R.id.textStationName)
        textStationStatus  = view.findViewById(R.id.textStationStatus)
        textStationCapacity= view.findViewById(R.id.textStationCapacity)
        buttonBookStation  = view.findViewById(R.id.buttonBookStation)

        val mapFragment = childFragmentManager
            .findFragmentById(R.id.map) as SupportMapFragment
        mapFragment.getMapAsync(this)

        buttonBookStation.setOnClickListener {
            startActivity(Intent(requireContext(), ReservationActivity::class.java))
        }
    }

    override fun onMapReady(googleMap: GoogleMap) {
        mMap = googleMap

        for (node in gridNodes) {
            val pos = LatLng(node.lat, node.lng)
            val marker = mMap.addMarker(
                MarkerOptions()
                    .position(pos)
                    .title(node.name)
            )
            marker?.tag = node
        }

        mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(
            LatLng(gridNodes[0].lat, gridNodes[0].lng), 13f
        ))

        mMap.setOnMarkerClickListener { marker ->
            val node = marker.tag as? GridNode ?: return@setOnMarkerClickListener false
            textStationName.text     = node.name
            textStationStatus.text   = "Status: ${node.status}"
            textStationCapacity.text = "Available Capacity: ${node.capacity}"
            buttonBookStation.isEnabled = node.status == "Active"
            cardStationDetails.visibility = View.VISIBLE
            false
        }

        mMap.setOnMapClickListener {
            cardStationDetails.visibility = View.GONE
        }
    }
}

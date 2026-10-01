package com.pavanuthsara.smartsolarmicrogridmobile.ui.operator

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.cardview.widget.CardView
import androidx.fragment.app.Fragment
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.MarkerOptions
import com.pavanuthsara.smartsolarmicrogridmobile.R
import com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer.GridNode

/**
 * OperatorMapFragment — read-only geographic view of nearby grid stations.
 * No booking button; operators use this for situational awareness only.
 */
class OperatorMapFragment : Fragment(), OnMapReadyCallback {

    private lateinit var mMap: GoogleMap
    private lateinit var cardDetails: CardView
    private lateinit var textStationName: TextView
    private lateinit var textStationInfo: TextView

    private val gridNodes = listOf(
        GridNode("N1", "Central Solar Node",  6.9271, 79.8612, "Active",      "120kW"),
        GridNode("N2", "South Wing Station",  6.9150, 79.8650, "Maintenance", "0kW"),
        GridNode("N3", "North East Grid",     6.9350, 79.8700, "Active",      "80kW")
    )

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? = inflater.inflate(R.layout.fragment_operator_map, container, false)

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        cardDetails      = view.findViewById(R.id.cardOperatorStationDetails)
        textStationName  = view.findViewById(R.id.textOperatorStationName)
        textStationInfo  = view.findViewById(R.id.textOperatorStationDetails)

        val mapFrag = childFragmentManager
            .findFragmentById(R.id.operatorMap) as SupportMapFragment
        mapFrag.getMapAsync(this)
    }

    override fun onMapReady(googleMap: GoogleMap) {
        mMap = googleMap

        for (node in gridNodes) {
            val marker = mMap.addMarker(
                MarkerOptions()
                    .position(LatLng(node.lat, node.lng))
                    .title(node.name)
            )
            marker?.tag = node
        }

        mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(
            LatLng(gridNodes[0].lat, gridNodes[0].lng), 13f
        ))

        mMap.setOnMarkerClickListener { marker ->
            val node = marker.tag as? GridNode ?: return@setOnMarkerClickListener false
            textStationName.text = node.name
            textStationInfo.text = "Status: ${node.status}\nCapacity: ${node.capacity}"
            cardDetails.visibility = View.VISIBLE
            false
        }

        mMap.setOnMapClickListener {
            cardDetails.visibility = View.GONE
        }
    }
}

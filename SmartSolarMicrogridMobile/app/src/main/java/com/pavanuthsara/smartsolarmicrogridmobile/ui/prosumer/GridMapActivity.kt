package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import android.os.Bundle
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.cardview.widget.CardView
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.LatLngBounds
import com.google.android.gms.maps.model.MarkerOptions
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.google.android.material.button.MaterialButton
import com.pavanuthsara.smartsolarmicrogridmobile.R
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.ApiResult
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.StationDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.repository.StationRepository
import com.pavanuthsara.smartsolarmicrogridmobile.ui.common.DisplayFormats
import com.pavanuthsara.smartsolarmicrogridmobile.ui.common.NavigationUtils
import com.pavanuthsara.smartsolarmicrogridmobile.ui.common.endExpiredSession
import kotlinx.coroutines.launch

// Shows the solar stations returned by the API as markers. Tapping a marker shows the station,
// and "View Slots and Book" opens that station's bookable slots.
class GridMapActivity : AppCompatActivity(), OnMapReadyCallback {

    private lateinit var stationRepository: StationRepository

    private var map: GoogleMap? = null
    private var userLocation: LatLng? = null
    private var selectedStation: StationDto? = null

    private lateinit var cardMapStatus: CardView
    private lateinit var progressMap: ProgressBar
    private lateinit var textMapStatus: TextView
    private lateinit var buttonRetry: MaterialButton
    private lateinit var cardStationDetails: CardView
    private lateinit var textStationName: TextView
    private lateinit var textStationDetails: TextView
    private lateinit var buttonBookStation: MaterialButton
    private lateinit var bottomNavigation: BottomNavigationView

    private val locationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {
            // Granted or not, the stations are loaded; without location the map starts at the default point.
            onLocationDecided()
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_grid_map)

        stationRepository = StationRepository(this)

        cardMapStatus = findViewById(R.id.cardMapStatus)
        progressMap = findViewById(R.id.progressMap)
        textMapStatus = findViewById(R.id.textMapStatus)
        buttonRetry = findViewById(R.id.buttonRetry)
        cardStationDetails = findViewById(R.id.cardStationDetails)
        textStationName = findViewById(R.id.textStationName)
        textStationDetails = findViewById(R.id.textStationDetails)
        buttonBookStation = findViewById(R.id.buttonBookStation)
        bottomNavigation = findViewById(R.id.bottomNavigation)

        NavigationUtils.setupBottomNav(bottomNavigation, this, R.id.nav_stations)

        val mapFragment = supportFragmentManager.findFragmentById(R.id.map) as SupportMapFragment
        mapFragment.getMapAsync(this)

        buttonRetry.setOnClickListener { loadStations() }

        buttonBookStation.setOnClickListener {
            val station = selectedStation ?: return@setOnClickListener
            val intent = Intent(this, StationSlotsActivity::class.java)
            intent.putExtra(StationSlotsActivity.EXTRA_STATION_ID, station.id)
            intent.putExtra(StationSlotsActivity.EXTRA_STATION_NAME, station.stationName)
            startActivity(intent)
        }
    }

    override fun onResume() {
        super.onResume()
        bottomNavigation.selectedItemId = R.id.nav_stations
    }

    override fun onMapReady(googleMap: GoogleMap) {
        map = googleMap

        googleMap.setOnMarkerClickListener { marker ->
            val station = marker.tag as? StationDto
            if (station != null) showStation(station)
            false // keep the default behaviour: centre on the marker and show its title
        }

        googleMap.setOnMapClickListener {
            selectedStation = null
            cardStationDetails.visibility = View.GONE
        }

        if (hasLocationPermission()) {
            onLocationDecided()
        } else {
            locationPermissionLauncher.launch(
                arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
            )
        }
    }

    // Uses the phone's last known position when allowed, then loads the stations around it.
    @SuppressLint("MissingPermission")
    private fun onLocationDecided() {
        if (hasLocationPermission()) {
            map?.isMyLocationEnabled = true
            lastKnownLocation()?.let { userLocation = LatLng(it.latitude, it.longitude) }
        }
        loadStations()
    }

    private fun loadStations() {
        showStatus(getString(R.string.map_loading), loading = true, canRetry = false)
        val origin = userLocation ?: DEFAULT_LOCATION

        lifecycleScope.launch {
            when (val result = stationRepository.nearbyStations(origin.latitude, origin.longitude, SEARCH_RADIUS_METERS)) {
                is ApiResult.Success -> showStations(result.data, origin)
                is ApiResult.Failure ->
                    if (result.sessionExpired) {
                        endExpiredSession()
                    } else {
                        showStatus(result.message, loading = false, canRetry = true)
                    }
            }
        }
    }

    private fun showStations(stations: List<StationDto>, origin: LatLng) {
        val googleMap = map ?: return
        googleMap.clear()
        selectedStation = null
        cardStationDetails.visibility = View.GONE

        if (stations.isEmpty()) {
            val note = if (userLocation == null) "using a default location" else "near you"
            showStatus("No solar stations found within ${(SEARCH_RADIUS_METERS / 1000).toInt()} km ($note).", loading = false, canRetry = true)
            googleMap.moveCamera(CameraUpdateFactory.newLatLngZoom(origin, 11f))
            return
        }

        for (station in stations) {
            val marker = googleMap.addMarker(
                MarkerOptions()
                    .position(LatLng(station.latitude, station.longitude))
                    .title(station.stationName)
            )
            marker?.tag = station
        }

        if (userLocation == null) {
            showStatus(getString(R.string.map_default_location), loading = false, canRetry = false)
        } else {
            cardMapStatus.visibility = View.GONE
        }

        fitCamera(googleMap, stations)
    }

    // Frames every station, plus the user's position when it is known.
    private fun fitCamera(googleMap: GoogleMap, stations: List<StationDto>) {
        val points = stations.map { LatLng(it.latitude, it.longitude) } + listOfNotNull(userLocation)
        if (points.size == 1) {
            googleMap.moveCamera(CameraUpdateFactory.newLatLngZoom(points[0], 14f))
            return
        }

        val bounds = LatLngBounds.builder().apply { points.forEach { include(it) } }.build()
        googleMap.moveCamera(CameraUpdateFactory.newLatLngBounds(bounds, CAMERA_PADDING_PX))
    }

    private fun showStation(station: StationDto) {
        selectedStation = station
        textStationName.text = station.stationName

        val lines = mutableListOf(
            "${station.stationCode} - ${station.city}",
            station.addressLine,
            "Battery: ${DisplayFormats.kwh(station.capacityKwh)}, ${station.totalBays} bays"
        )
        station.operatingSchedule?.takeIf { it.isNotBlank() }?.let { lines.add("Operating hours: ${it.replace("-", " - ")}") }
        textStationDetails.text = lines.joinToString("\n")

        cardStationDetails.visibility = View.VISIBLE
    }

    private fun showStatus(message: String, loading: Boolean, canRetry: Boolean) {
        textMapStatus.text = message
        progressMap.visibility = if (loading) View.VISIBLE else View.GONE
        buttonRetry.visibility = if (canRetry) View.VISIBLE else View.GONE
        cardMapStatus.visibility = View.VISIBLE
    }

    private fun hasLocationPermission(): Boolean =
        ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
            ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED

    // The most recent position any location provider remembers, or null when there is none.
    @SuppressLint("MissingPermission")
    private fun lastKnownLocation(): Location? {
        val manager = getSystemService(LOCATION_SERVICE) as? LocationManager ?: return null
        return try {
            manager.getProviders(true)
                .mapNotNull { manager.getLastKnownLocation(it) }
                .maxByOrNull { it.time }
        } catch (e: SecurityException) {
            null
        }
    }

    companion object {
        // Used when the phone's location is unavailable: Colombo.
        private val DEFAULT_LOCATION = LatLng(6.9271, 79.8612)
        private const val SEARCH_RADIUS_METERS = 50_000.0
        private const val CAMERA_PADDING_PX = 140
    }
}

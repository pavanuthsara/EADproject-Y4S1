package com.pavanuthsara.smartsolarmicrogridmobile.ui.main

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import com.google.android.material.bottomappbar.BottomAppBar
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.google.android.material.floatingactionbutton.FloatingActionButton
import com.pavanuthsara.smartsolarmicrogridmobile.R
import com.pavanuthsara.smartsolarmicrogridmobile.data.session.SessionManager
import com.pavanuthsara.smartsolarmicrogridmobile.ui.operator.OperatorMapFragment
import com.pavanuthsara.smartsolarmicrogridmobile.ui.operator.OperatorProfileFragment
import com.pavanuthsara.smartsolarmicrogridmobile.ui.operator.ScannerFragment
import com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer.BookingsFragment
import com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer.ProfileFragment
import com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer.ProsumerLoginActivity
import com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer.ProsumerMapFragment
import com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer.ReservationActivity

/**
 * MainActivity — single shell activity that hosts role-aware bottom navigation.
 *
 * • Prosumer: Home | Map | [FAB] | Bookings | Profile
 * • Grid Operator: Scanner | Map | Profile/Settings  (no FAB)
 *
 * Role is read exclusively from [SessionManager] (the authoritative source set
 * at login).  The old "app_prefs / user_role" key is still written by
 * [ProsumerLoginActivity] for legacy fallback, but this class no longer reads it.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var sessionManager: SessionManager
    private lateinit var bottomAppBar: BottomAppBar
    private lateinit var bottomNav: BottomNavigationView
    private lateinit var fabBook: FloatingActionButton

    // Tracks current tab so we can restore on back-stack if needed
    private var currentNavId: Int = -1

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        sessionManager = SessionManager.getInstance(this)

        // Guard: not logged in → redirect to login
        if (!sessionManager.isLoggedIn()) {
            redirectToLogin()
            return
        }

        bottomAppBar = findViewById(R.id.bottomAppBar)
        bottomNav    = findViewById(R.id.bottomNavigationView)
        fabBook      = findViewById(R.id.fabBook)

        if (sessionManager.isGridOperator()) {
            setupOperatorNavigation()
        } else {
            setupProsumerNavigation()
        }
    }

    // ── Prosumer Navigation ───────────────────────────────────────────────────

    private fun setupProsumerNavigation() {
        bottomNav.menu.clear()
        bottomNav.inflateMenu(R.menu.menu_prosumer_nav)
        // BottomAppBar needs its background null so the cradle cutout is visible
        bottomNav.background = null

        fabBook.visibility = View.VISIBLE
        fabBook.setOnClickListener {
            startActivity(Intent(this, ReservationActivity::class.java))
        }

        // Default tab
        loadFragment(HomeFragment(), R.id.nav_home)

        bottomNav.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_home -> {
                    loadFragment(HomeFragment(), item.itemId)
                    true
                }
                R.id.nav_map -> {
                    loadFragment(ProsumerMapFragment(), item.itemId)
                    true
                }
                R.id.nav_placeholder -> {
                    // Centre spacer — do nothing, keep current selection
                    false
                }
                R.id.nav_bookings -> {
                    loadFragment(BookingsFragment(), item.itemId)
                    true
                }
                R.id.nav_profile -> {
                    loadFragment(ProfileFragment(), item.itemId)
                    true
                }
                else -> false
            }
        }
    }

    // ── Operator Navigation ───────────────────────────────────────────────────

    private fun setupOperatorNavigation() {
        bottomNav.menu.clear()
        bottomNav.inflateMenu(R.menu.menu_operator_nav)

        // No FAB for operators
        fabBook.visibility = View.GONE

        // Default tab — Scanner
        loadFragment(ScannerFragment(), R.id.nav_scanner)

        bottomNav.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_scanner -> {
                    loadFragment(ScannerFragment(), item.itemId)
                    true
                }
                R.id.nav_map -> {
                    loadFragment(OperatorMapFragment(), item.itemId)
                    true
                }
                R.id.nav_profile -> {
                    loadFragment(OperatorProfileFragment(), item.itemId)
                    true
                }
                else -> false
            }
        }
    }

    // ── Fragment Loading ──────────────────────────────────────────────────────

    private fun loadFragment(fragment: Fragment, navId: Int) {
        if (currentNavId == navId) return  // already on this tab — no-op
        currentNavId = navId

        supportFragmentManager.beginTransaction()
            .setReorderingAllowed(true)
            .replace(R.id.fragmentContainer, fragment)
            .commit()
    }

    /**
     * Called by child fragments (e.g. HomeFragment quick-action cards)
     * to programmatically switch to another tab.
     */
    fun navigateTo(navItemId: Int) {
        bottomNav.selectedItemId = navItemId
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private fun redirectToLogin() {
        startActivity(Intent(this, ProsumerLoginActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        })
        finish()
    }
}
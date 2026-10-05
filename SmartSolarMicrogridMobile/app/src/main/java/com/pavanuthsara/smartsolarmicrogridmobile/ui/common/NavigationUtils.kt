package com.pavanuthsara.smartsolarmicrogridmobile.ui.common

import android.app.Activity
import android.content.Intent
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.pavanuthsara.smartsolarmicrogridmobile.R
import com.pavanuthsara.smartsolarmicrogridmobile.ui.main.MainActivity
import com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer.GridMapActivity
import com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer.ProsumerProfileActivity
import com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer.ReservationListActivity

object NavigationUtils {

    fun setupBottomNav(
        bottomNav: BottomNavigationView,
        activity: Activity,
        currentNavId: Int
    ) {
        bottomNav.selectedItemId = currentNavId

        bottomNav.setOnItemSelectedListener { item ->
            if (item.itemId == currentNavId) {
                return@setOnItemSelectedListener true
            }

            val targetClass = when (item.itemId) {
                R.id.nav_dashboard -> MainActivity::class.java
                R.id.nav_reservations -> ReservationListActivity::class.java
                R.id.nav_stations -> GridMapActivity::class.java
                R.id.nav_profile -> ProsumerProfileActivity::class.java
                else -> null
            }

            if (targetClass != null) {
                val intent = Intent(activity, targetClass).apply {
                    flags = Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                }
                activity.startActivity(intent)
                activity.overridePendingTransition(0, 0)
                true
            } else {
                false
            }
        }
    }
}

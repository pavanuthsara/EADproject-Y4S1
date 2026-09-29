package com.pavanuthsara.smartsolarmicrogridmobile.ui.main

import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.pavanuthsara.smartsolarmicrogridmobile.R

class MainActivity : AppCompatActivity() {

    // Initializes the ViewModel tied to this Activity's lifecycle
    private val testUserViewModel: TestUserViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        // Example: Saving a user when the activity loads
        // In a real app, you would call this after a login button click
        testUserViewModel.saveUser(
            nic  = 1,
            username = "pavan",
            email = "pavan@example.com",
            isLoggedIn = true
        )
        
        findViewById<com.google.android.material.button.MaterialButton>(R.id.buttonProfile).setOnClickListener {
            startActivity(android.content.Intent(this, com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer.ProsumerProfileActivity::class.java))
        }
    }
}
package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.TextInputLayout
import com.pavanuthsara.smartsolarmicrogridmobile.R

class ProsumerProfileActivity : AppCompatActivity() {

    private val viewModel: ProsumerProfileViewModel by viewModels()

    private lateinit var inputNic: TextInputLayout
    private lateinit var inputFullName: TextInputLayout
    private lateinit var inputEmail: TextInputLayout
    private lateinit var inputPhone: TextInputLayout

    // Sets up the prosumer profile screen.
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_prosumer_profile)

        val rootView = findViewById<android.view.View>(R.id.profileRoot)
        ViewCompat.setOnApplyWindowInsetsListener(rootView) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        inputNic = findViewById(R.id.inputNic)
        inputFullName = findViewById(R.id.inputFullName)
        inputEmail = findViewById(R.id.inputEmail)
        inputPhone = findViewById(R.id.inputPhone)

        // Read-only for now: profile changes and deactivation move to the API in the profile step.
        listOf(inputNic, inputFullName, inputEmail, inputPhone).forEach { it.isEnabled = false }
        findViewById<MaterialButton>(R.id.buttonSave).isEnabled = false
        findViewById<MaterialButton>(R.id.buttonDeactivate).isEnabled = false

        viewModel.profileStatus.observe(this) { status ->
            when (status) {
                is ProfileStatus.Loaded -> {
                    inputNic.editText?.setText(status.user.nic)
                    inputFullName.editText?.setText(status.user.fullName)
                    inputEmail.editText?.setText(status.user.email)
                    inputPhone.editText?.setText(status.user.phone)
                }
                ProfileStatus.SignedOut -> {
                    Toast.makeText(this, "Session expired. Please log in again.", Toast.LENGTH_SHORT).show()
                    val intent = Intent(this, ProsumerLoginActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    startActivity(intent)
                    finish()
                }
                ProfileStatus.Loading, ProfileStatus.Idle -> Unit
            }
        }

        viewModel.loadProfile()
    }
}

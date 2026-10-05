package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.lifecycleScope
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.google.android.material.button.MaterialButton
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import com.pavanuthsara.smartsolarmicrogridmobile.R
import com.pavanuthsara.smartsolarmicrogridmobile.data.local.CachedUser
import com.pavanuthsara.smartsolarmicrogridmobile.data.session.UserSession
import com.pavanuthsara.smartsolarmicrogridmobile.ui.common.NavigationUtils
import kotlinx.coroutines.launch

class ProsumerProfileActivity : AppCompatActivity() {

    private val viewModel: ProsumerProfileViewModel by viewModels()
    private lateinit var userSession: UserSession

    private lateinit var textAvatarInitials: TextView
    private lateinit var textProfileName: TextView
    private lateinit var textProfileEmail: TextView
    private lateinit var textAccountStatusBadge: TextView

    private lateinit var inputNic: TextInputLayout
    private lateinit var inputFullName: TextInputLayout
    private lateinit var inputEmail: TextInputLayout
    private lateinit var inputPhone: TextInputLayout
    private lateinit var inputAddress: TextInputLayout
    private lateinit var inputSolarCapacity: TextInputLayout

    private lateinit var editNic: TextInputEditText
    private lateinit var editFullName: TextInputEditText
    private lateinit var editEmail: TextInputEditText
    private lateinit var editPhone: TextInputEditText
    private lateinit var editAddress: TextInputEditText
    private lateinit var editSolarCapacity: TextInputEditText

    private lateinit var buttonSave: MaterialButton
    private lateinit var buttonDeactivate: MaterialButton
    private lateinit var buttonLogoutHeader: MaterialButton
    private lateinit var progressProfile: ProgressBar
    private lateinit var bottomNavigation: BottomNavigationView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_prosumer_profile)

        userSession = UserSession(this)

        val rootView = findViewById<View>(R.id.profileRoot)
        ViewCompat.setOnApplyWindowInsetsListener(rootView) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, 0)
            insets
        }

        bindViews()
        setupListeners()
        setupObservers()

        NavigationUtils.setupBottomNav(bottomNavigation, this, R.id.nav_profile)

        viewModel.loadProfile()
    }

    override fun onResume() {
        super.onResume()
        bottomNavigation.selectedItemId = R.id.nav_profile
    }

    private fun bindViews() {
        textAvatarInitials = findViewById(R.id.textAvatarInitials)
        textProfileName = findViewById(R.id.textProfileName)
        textProfileEmail = findViewById(R.id.textProfileEmail)
        textAccountStatusBadge = findViewById(R.id.textAccountStatusBadge)

        inputNic = findViewById(R.id.inputNic)
        inputFullName = findViewById(R.id.inputFullName)
        inputEmail = findViewById(R.id.inputEmail)
        inputPhone = findViewById(R.id.inputPhone)
        inputAddress = findViewById(R.id.inputAddress)
        inputSolarCapacity = findViewById(R.id.inputSolarCapacity)

        editNic = findViewById(R.id.editNic)
        editFullName = findViewById(R.id.editFullName)
        editEmail = findViewById(R.id.editEmail)
        editPhone = findViewById(R.id.editPhone)
        editAddress = findViewById(R.id.editAddress)
        editSolarCapacity = findViewById(R.id.editSolarCapacity)

        buttonSave = findViewById(R.id.buttonSave)
        buttonDeactivate = findViewById(R.id.buttonDeactivate)
        buttonLogoutHeader = findViewById(R.id.buttonLogoutHeader)
        progressProfile = findViewById(R.id.progressProfile)
        bottomNavigation = findViewById(R.id.bottomNavigation)
    }

    private fun setupListeners() {
        buttonSave.setOnClickListener {
            clearErrors()
            val fullName = editFullName.text?.toString().orEmpty()
            val email = editEmail.text?.toString().orEmpty()
            val phone = editPhone.text?.toString().orEmpty()
            val address = editAddress.text?.toString().orEmpty()
            val capacityStr = editSolarCapacity.text?.toString().orEmpty()
            val solarCapacity = capacityStr.toDoubleOrNull() ?: 0.0

            viewModel.updateProfile(
                fullName = fullName,
                email = email,
                phone = phone,
                address = address,
                solarCapacityKw = solarCapacity
            )
        }

        buttonDeactivate.setOnClickListener {
            confirmDeactivation()
        }

        buttonLogoutHeader.setOnClickListener {
            confirmLogout()
        }
    }

    private fun setupObservers() {
        viewModel.loadStatus.observe(this) { status ->
            when (status) {
                is ProfileLoadStatus.Loaded -> populateFields(status.user)
                ProfileLoadStatus.SignedOut -> returnToLogin("Session expired. Please log in again.")
                ProfileLoadStatus.Loading, ProfileLoadStatus.Idle, is ProfileLoadStatus.Error -> Unit
            }
        }

        viewModel.actionStatus.observe(this) { status ->
            when (status) {
                is ProfileActionStatus.Loading -> {
                    progressProfile.visibility = View.VISIBLE
                    buttonSave.isEnabled = false
                    buttonDeactivate.isEnabled = false
                }
                is ProfileActionStatus.UpdateSuccess -> {
                    progressProfile.visibility = View.GONE
                    buttonSave.isEnabled = true
                    buttonDeactivate.isEnabled = true
                    Toast.makeText(this, status.message, Toast.LENGTH_SHORT).show()
                }
                is ProfileActionStatus.UpdateError -> {
                    progressProfile.visibility = View.GONE
                    buttonSave.isEnabled = true
                    buttonDeactivate.isEnabled = true
                    Toast.makeText(this, status.message, Toast.LENGTH_LONG).show()
                }
                is ProfileActionStatus.DeactivationSuccess -> {
                    progressProfile.visibility = View.GONE
                    MaterialAlertDialogBuilder(this)
                        .setTitle("Account Deactivated")
                        .setMessage(status.message)
                        .setPositiveButton("OK") { _, _ ->
                            returnToLogin(null)
                        }
                        .setCancelable(false)
                        .show()
                }
                is ProfileActionStatus.DeactivationError -> {
                    progressProfile.visibility = View.GONE
                    buttonSave.isEnabled = true
                    buttonDeactivate.isEnabled = true
                    Toast.makeText(this, status.message, Toast.LENGTH_LONG).show()
                }
                ProfileActionStatus.Idle -> {
                    progressProfile.visibility = View.GONE
                    buttonSave.isEnabled = true
                    buttonDeactivate.isEnabled = true
                }
            }
        }
    }

    private fun populateFields(user: CachedUser) {
        editNic.setText(user.nic)
        editFullName.setText(user.fullName)
        editEmail.setText(user.email)
        editPhone.setText(user.phone)
        editAddress.setText(user.address)
        if (user.solarCapacityKw > 0) {
            editSolarCapacity.setText(user.solarCapacityKw.toString())
        }

        textProfileName.text = user.fullName.ifBlank { "Solar Prosumer" }
        textProfileEmail.text = user.email.ifBlank { user.nic }

        val initials = user.fullName.split(" ")
            .filter { it.isNotBlank() }
            .take(2)
            .map { it.first().uppercaseChar() }
            .joinToString("")
        textAvatarInitials.text = if (initials.isNotBlank()) initials else "SP"
    }

    private fun clearErrors() {
        inputFullName.error = null
        inputEmail.error = null
        inputPhone.error = null
        inputAddress.error = null
        inputSolarCapacity.error = null
    }

    private fun confirmDeactivation() {
        MaterialAlertDialogBuilder(this)
            .setTitle("Deactivate Account?")
            .setMessage(
                "Are you sure you want to request account deactivation?\n\n" +
                "• Your account will be deactivated immediately.\n" +
                "• You will be signed out from the microgrid mobile app.\n" +
                "• You cannot reactivate your account by yourself. Only Backoffice administrators from the web portal can approve and reactivate your account."
            )
            .setPositiveButton("Yes, Deactivate") { _, _ ->
                viewModel.deactivateAccount()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun confirmLogout() {
        MaterialAlertDialogBuilder(this)
            .setTitle("Log Out")
            .setMessage("Are you sure you want to log out?")
            .setPositiveButton("Log Out") { _, _ ->
                lifecycleScope.launch {
                    userSession.signOut()
                    returnToLogin(null)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun returnToLogin(message: String?) {
        if (!message.isNullOrBlank()) {
            Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
        }
        val intent = Intent(this, ProsumerLoginActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        startActivity(intent)
        finish()
    }
}

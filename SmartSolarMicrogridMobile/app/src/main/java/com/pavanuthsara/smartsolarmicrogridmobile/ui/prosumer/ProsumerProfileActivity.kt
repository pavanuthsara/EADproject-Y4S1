package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.appcompat.app.AlertDialog
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

        val sharedPrefs = getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        val loggedInNic = sharedPrefs.getString("logged_in_nic", null)

        if (loggedInNic == null) {
            Toast.makeText(this, "Session expired. Please log in again.", Toast.LENGTH_SHORT).show()
            startActivity(Intent(this, ProsumerLoginActivity::class.java))
            finish()
            return
        }

        viewModel.loadProfile(loggedInNic)

        findViewById<MaterialButton>(R.id.buttonSave).setOnClickListener {
            attemptUpdate()
        }

        findViewById<MaterialButton>(R.id.buttonDeactivate).setOnClickListener {
            showDeactivateConfirmationDialog()
        }

        viewModel.profileStatus.observe(this) { status ->
            when (status) {
                is ProfileStatus.Loaded -> {
                    inputNic.editText?.setText(status.prosumer.nic)
                    inputFullName.editText?.setText(status.prosumer.fullName)
                    inputEmail.editText?.setText(status.prosumer.email)
                    inputPhone.editText?.setText(status.prosumer.phoneNumber)
                }
                is ProfileStatus.UpdateSuccess -> {
                    Toast.makeText(this, "Profile updated successfully!", Toast.LENGTH_SHORT).show()
                }
                is ProfileStatus.DeactivateSuccess -> {
                    Toast.makeText(this, "Account deactivated.", Toast.LENGTH_SHORT).show()
                    sharedPrefs.edit().remove("logged_in_nic").apply()
                    val intent = Intent(this, ProsumerLoginActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    startActivity(intent)
                    finish()
                }
                is ProfileStatus.Error -> {
                    Toast.makeText(this, status.message, Toast.LENGTH_LONG).show()
                }
                ProfileStatus.Loading, ProfileStatus.Idle -> Unit
            }
        }
    }

    private fun attemptUpdate() {
        val fullName = inputFullName.editText?.text?.toString()?.trim().orEmpty()
        val email = inputEmail.editText?.text?.toString()?.trim().orEmpty()
        val phone = inputPhone.editText?.text?.toString()?.trim().orEmpty()

        inputFullName.error = if (fullName.isEmpty()) getString(R.string.error_full_name_required) else null
        
        inputEmail.error = when {
            email.isEmpty() -> getString(R.string.error_email_required)
            !ProsumerRegistrationViewModel.isValidEmail(email) -> getString(R.string.error_email_invalid)
            else -> null
        }
        
        inputPhone.error = when {
            phone.isEmpty() -> getString(R.string.error_phone_required)
            !ProsumerRegistrationViewModel.isValidPhoneNumber(phone) -> getString(R.string.error_phone_invalid)
            else -> null
        }

        val isValid = listOf(inputFullName, inputEmail, inputPhone).none { !it.error.isNullOrEmpty() }

        if (isValid) {
            viewModel.updateProfile(fullName, email, phone)
        }
    }

    private fun showDeactivateConfirmationDialog() {
        AlertDialog.Builder(this)
            .setTitle("Deactivate Account")
            .setMessage("Are you sure you want to deactivate your account? This action cannot be undone and all your data will be deleted.")
            .setPositiveButton("Deactivate") { _, _ ->
                viewModel.deactivateAccount()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
}

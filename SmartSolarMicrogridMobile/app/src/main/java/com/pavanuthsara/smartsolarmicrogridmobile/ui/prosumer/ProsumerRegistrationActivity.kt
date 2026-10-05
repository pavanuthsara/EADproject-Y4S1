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
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.RegisterRequestDto

class ProsumerRegistrationActivity : AppCompatActivity() {

    private val viewModel: ProsumerRegistrationViewModel by viewModels()

    private lateinit var inputNic: TextInputLayout
    private lateinit var inputFullName: TextInputLayout
    private lateinit var inputEmail: TextInputLayout
    private lateinit var inputPhone: TextInputLayout
    private lateinit var inputAddress: TextInputLayout
    private lateinit var inputSolarCapacity: TextInputLayout
    private lateinit var inputPassword: TextInputLayout
    private lateinit var inputConfirmPassword: TextInputLayout
    private lateinit var buttonRegister: MaterialButton

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_prosumer_registration)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.registrationRoot)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        inputNic = findViewById(R.id.inputNic)
        inputFullName = findViewById(R.id.inputFullName)
        inputEmail = findViewById(R.id.inputEmail)
        inputPhone = findViewById(R.id.inputPhone)
        inputAddress = findViewById(R.id.inputAddress)
        inputSolarCapacity = findViewById(R.id.inputSolarCapacity)
        inputPassword = findViewById(R.id.inputPassword)
        inputConfirmPassword = findViewById(R.id.inputConfirmPassword)
        buttonRegister = findViewById(R.id.buttonRegister)

        buttonRegister.setOnClickListener { attemptRegistration() }

        findViewById<MaterialButton>(R.id.buttonLoginRedirect).setOnClickListener {
            openLogin(registeredNic = null)
        }

        viewModel.registrationStatus.observe(this) { status ->
            when (status) {
                RegistrationStatus.Loading -> buttonRegister.isEnabled = false
                is RegistrationStatus.Success -> {
                    Toast.makeText(this, status.message, Toast.LENGTH_LONG).show()
                    openLogin(registeredNic = status.nic)
                }
                is RegistrationStatus.Error -> {
                    buttonRegister.isEnabled = true
                    Toast.makeText(this, status.message, Toast.LENGTH_LONG).show()
                }
                RegistrationStatus.Idle -> buttonRegister.isEnabled = true
            }
        }
    }

    // Returns to the login screen; after a successful registration the NIC is filled in for the user.
    private fun openLogin(registeredNic: String?) {
        val intent = Intent(this, ProsumerLoginActivity::class.java)
        registeredNic?.let { intent.putExtra(ProsumerLoginActivity.EXTRA_REGISTERED_NIC, it) }
        startActivity(intent)
        finish()
    }

    // Checks the form for typos before sending it; the API applies the real rules (unique NIC and email).
    private fun attemptRegistration() {
        val nic = inputNic.editText?.text?.toString()?.trim().orEmpty()
        val fullName = inputFullName.editText?.text?.toString()?.trim().orEmpty()
        val email = inputEmail.editText?.text?.toString()?.trim().orEmpty()
        val phone = inputPhone.editText?.text?.toString()?.trim().orEmpty()
        val address = inputAddress.editText?.text?.toString()?.trim().orEmpty()
        val solarCapacityText = inputSolarCapacity.editText?.text?.toString()?.trim().orEmpty()
        val password = inputPassword.editText?.text?.toString().orEmpty()
        val confirmPassword = inputConfirmPassword.editText?.text?.toString().orEmpty()

        val solarCapacityKw = ProsumerRegistrationViewModel.parseSolarCapacity(solarCapacityText)

        inputNic.error = when {
            nic.isEmpty() -> getString(R.string.error_nic_required)
            !ProsumerRegistrationViewModel.isValidNic(nic) -> getString(R.string.error_nic_invalid)
            else -> null
        }
        inputFullName.error =
            if (fullName.isEmpty()) getString(R.string.error_full_name_required) else null
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
        inputAddress.error =
            if (address.isEmpty()) getString(R.string.error_address_required) else null
        inputSolarCapacity.error =
            if (solarCapacityKw == null) getString(R.string.error_solar_capacity_invalid) else null
        inputPassword.error = when {
            password.isEmpty() -> getString(R.string.error_password_required)
            !ProsumerRegistrationViewModel.isValidPassword(password) -> getString(R.string.error_password_invalid)
            else -> null
        }
        inputConfirmPassword.error = when {
            confirmPassword.isEmpty() -> getString(R.string.error_confirm_password_required)
            password != confirmPassword -> getString(R.string.error_password_mismatch)
            else -> null
        }

        val fields = listOf(
            inputNic, inputFullName, inputEmail, inputPhone,
            inputAddress, inputSolarCapacity, inputPassword, inputConfirmPassword
        )
        if (fields.none { !it.error.isNullOrEmpty() } && solarCapacityKw != null) {
            viewModel.registerProsumer(
                RegisterRequestDto(
                    nic = nic,
                    fullName = fullName,
                    email = email,
                    phone = phone,
                    password = password,
                    address = address,
                    solarCapacityKw = solarCapacityKw
                )
            )
        }
    }
}

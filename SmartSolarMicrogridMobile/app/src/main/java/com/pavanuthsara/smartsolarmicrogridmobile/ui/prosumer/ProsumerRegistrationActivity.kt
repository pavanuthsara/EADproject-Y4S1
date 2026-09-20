package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.os.Bundle
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.google.android.material.textfield.TextInputLayout
import com.pavanuthsara.smartsolarmicrogridmobile.R

class ProsumerRegistrationActivity : AppCompatActivity() {

    private val viewModel: ProsumerRegistrationViewModel by viewModels()

    private lateinit var inputNic: TextInputLayout
    private lateinit var inputFullName: TextInputLayout
    private lateinit var inputEmail: TextInputLayout
    private lateinit var inputPhone: TextInputLayout
    private lateinit var inputPassword: TextInputLayout
    private lateinit var inputConfirmPassword: TextInputLayout

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
        inputPassword = findViewById(R.id.inputPassword)
        inputConfirmPassword = findViewById(R.id.inputConfirmPassword)

        findViewById<com.google.android.material.button.MaterialButton>(R.id.buttonRegister)
            .setOnClickListener { attemptRegistration() }

        findViewById<com.google.android.material.button.MaterialButton>(R.id.buttonLoginRedirect)
            .setOnClickListener {
                startActivity(android.content.Intent(this, ProsumerLoginActivity::class.java))
                finish()
            }

        viewModel.registrationStatus.observe(this) { status ->
            when (status) {
                is RegistrationStatus.Success -> {
                    Toast.makeText(this, R.string.registration_success, Toast.LENGTH_SHORT).show()
                    clearForm()
                }

                is RegistrationStatus.Error -> Toast.makeText(this, status.message, Toast.LENGTH_LONG).show()

                RegistrationStatus.Idle -> Unit
            }
        }
    }

    private fun attemptRegistration() {
        val nic = inputNic.editText?.text?.toString()?.trim().orEmpty()
        val fullName = inputFullName.editText?.text?.toString()?.trim().orEmpty()
        val email = inputEmail.editText?.text?.toString()?.trim().orEmpty()
        val phone = inputPhone.editText?.text?.toString()?.trim().orEmpty()
        val password = inputPassword.editText?.text?.toString().orEmpty()
        val confirmPassword = inputConfirmPassword.editText?.text?.toString().orEmpty()

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

        val isValid = listOf(inputNic, inputFullName, inputEmail, inputPhone, inputPassword, inputConfirmPassword)
            .none { !it.error.isNullOrEmpty() }

        if (isValid) {
            viewModel.registerProsumer(nic, fullName, email, phone, password)
        }
    }

    private fun clearForm() {
        inputNic.editText?.text?.clear()
        inputFullName.editText?.text?.clear()
        inputEmail.editText?.text?.clear()
        inputPhone.editText?.text?.clear()
        inputPassword.editText?.text?.clear()
        inputConfirmPassword.editText?.text?.clear()
        inputNic.error = null
        inputFullName.error = null
        inputEmail.error = null
        inputPhone.error = null
        inputPassword.error = null
        inputConfirmPassword.error = null
    }
}
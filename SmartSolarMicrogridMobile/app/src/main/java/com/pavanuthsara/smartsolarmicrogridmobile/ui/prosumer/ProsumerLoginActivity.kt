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
import com.pavanuthsara.smartsolarmicrogridmobile.ui.main.MainActivity

class ProsumerLoginActivity : AppCompatActivity() {

    private val viewModel: ProsumerLoginViewModel by viewModels()

    private lateinit var inputNic: TextInputLayout
    private lateinit var inputPassword: TextInputLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_prosumer_login)
        
        val rootView = findViewById<android.view.View>(R.id.loginRoot)
        ViewCompat.setOnApplyWindowInsetsListener(rootView) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        inputNic = findViewById(R.id.inputNic)
        inputPassword = findViewById(R.id.inputPassword)

        findViewById<MaterialButton>(R.id.buttonLogin).setOnClickListener {
            attemptLogin()
        }

        findViewById<MaterialButton>(R.id.buttonRegisterRedirect).setOnClickListener {
            startActivity(Intent(this, ProsumerRegistrationActivity::class.java))
            finish()
        }

        viewModel.loginStatus.observe(this) { status ->
            when (status) {
                is LoginStatus.Success -> {
                    Toast.makeText(this, "Login successful", Toast.LENGTH_SHORT).show()
                    // Navigate to Main Activity or Dashboard
                    startActivity(Intent(this, MainActivity::class.java))
                    finish()
                }
                is LoginStatus.Error -> {
                    Toast.makeText(this, status.message, Toast.LENGTH_LONG).show()
                }
                LoginStatus.Idle -> Unit
            }
        }
    }

    private fun attemptLogin() {
        val nic = inputNic.editText?.text?.toString()?.trim().orEmpty()
        val password = inputPassword.editText?.text?.toString().orEmpty()

        inputNic.error = if (nic.isEmpty()) getString(R.string.error_nic_required) else null
        inputPassword.error = if (password.isEmpty()) getString(R.string.error_password_required) else null

        val isValid = listOf(inputNic, inputPassword).none { !it.error.isNullOrEmpty() }

        if (isValid) {
            viewModel.login(nic, password)
        }
    }
}

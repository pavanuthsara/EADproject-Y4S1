package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.google.android.material.button.MaterialButton
import com.google.android.material.button.MaterialButtonToggleGroup
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import com.pavanuthsara.smartsolarmicrogridmobile.R
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.ApiClient
import com.pavanuthsara.smartsolarmicrogridmobile.data.session.SessionManager
import com.pavanuthsara.smartsolarmicrogridmobile.ui.main.MainActivity
import com.pavanuthsara.smartsolarmicrogridmobile.ui.operator.OperatorDashboardActivity

class ProsumerLoginActivity : AppCompatActivity() {

    private val viewModel: ProsumerLoginViewModel by viewModels()
    private lateinit var sessionManager: SessionManager

    private lateinit var toggleRoleGroup: MaterialButtonToggleGroup
    private lateinit var textTitle: TextView
    private lateinit var textSubtitle: TextView
    private lateinit var inputNic: TextInputLayout
    private lateinit var inputEmail: TextInputLayout
    private lateinit var inputPassword: TextInputLayout
    private lateinit var buttonLogin: MaterialButton
    private lateinit var buttonRegisterRedirect: MaterialButton
    private lateinit var progressLoading: ProgressBar

    private var isOperatorMode = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_prosumer_login)

        sessionManager = SessionManager.getInstance(this)

        val rootView = findViewById<View>(R.id.loginRoot)
        ViewCompat.setOnApplyWindowInsetsListener(rootView) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        toggleRoleGroup = findViewById(R.id.toggleRoleGroup)
        textTitle = findViewById(R.id.textTitle)
        textSubtitle = findViewById(R.id.textSubtitle)
        inputNic = findViewById(R.id.inputNic)
        inputEmail = findViewById(R.id.inputEmail)
        inputPassword = findViewById(R.id.inputPassword)
        buttonLogin = findViewById(R.id.buttonLogin)
        buttonRegisterRedirect = findViewById(R.id.buttonRegisterRedirect)
        progressLoading = findViewById(R.id.progressLoading)

        findViewById<MaterialButton>(R.id.buttonServerSettings).setOnClickListener {
            showServerSettingsDialog()
        }

        setupRoleToggle()

        buttonLogin.setOnClickListener {
            attemptLogin()
        }

        buttonRegisterRedirect.setOnClickListener {
            startActivity(Intent(this, ProsumerRegistrationActivity::class.java))
            finish()
        }

        viewModel.loginStatus.observe(this) { status ->
            when (status) {
                is LoginStatus.Loading -> {
                    progressLoading.visibility = View.VISIBLE
                    buttonLogin.isEnabled = false
                }
                is LoginStatus.ProsumerSuccess -> {
                    progressLoading.visibility = View.GONE
                    buttonLogin.isEnabled = true
                    Toast.makeText(this, "Welcome, Prosumer!", Toast.LENGTH_SHORT).show()

                    // Write to legacy prefs (Room queries use logged_in_nic)
                    getSharedPreferences("app_prefs", MODE_PRIVATE)
                        .edit()
                        .putString("logged_in_nic", status.nic)
                        .putString("user_role", "PROSUMER")
                        .apply()
                    // Write role to SessionManager so MainActivity.isGridOperator() works
                    sessionManager.saveAuthSession(
                        token    = status.nic,
                        userId   = status.nic,
                        fullName = "",
                        email    = "",
                        role     = "Prosumer"
                    )

                    startActivity(Intent(this, MainActivity::class.java))
                    finish()
                }
                is LoginStatus.OperatorSuccess -> {
                    progressLoading.visibility = View.GONE
                    buttonLogin.isEnabled = true
                    Toast.makeText(this, "Welcome, ${status.auth.fullName}!", Toast.LENGTH_SHORT).show()

                    // SessionManager already written by loginOperator() in the ViewModel
                    getSharedPreferences("app_prefs", MODE_PRIVATE)
                        .edit()
                        .putString("user_role", "OPERATOR")
                        .apply()

                    startActivity(Intent(this, MainActivity::class.java))
                    finish()
                }
                is LoginStatus.Error -> {
                    progressLoading.visibility = View.GONE
                    buttonLogin.isEnabled = true
                    Toast.makeText(this, status.message, Toast.LENGTH_LONG).show()
                }
                LoginStatus.Idle -> {
                    progressLoading.visibility = View.GONE
                    buttonLogin.isEnabled = true
                }
            }
        }
    }

    private fun setupRoleToggle() {
        toggleRoleGroup.addOnButtonCheckedListener { _, checkedId, isChecked ->
            if (isChecked) {
                when (checkedId) {
                    R.id.buttonTabProsumer -> {
                        isOperatorMode = false
                        textTitle.text = getString(R.string.prosumer_login_title)
                        textSubtitle.text = getString(R.string.prosumer_login_subtitle)
                        inputNic.visibility = View.VISIBLE
                        inputEmail.visibility = View.GONE
                        buttonRegisterRedirect.visibility = View.VISIBLE
                        inputNic.error = null
                        inputPassword.error = null
                    }
                    R.id.buttonTabOperator -> {
                        isOperatorMode = true
                        textTitle.text = getString(R.string.operator_login_title)
                        textSubtitle.text = getString(R.string.operator_login_subtitle)
                        inputNic.visibility = View.GONE
                        inputEmail.visibility = View.VISIBLE
                        buttonRegisterRedirect.visibility = View.GONE
                        inputEmail.error = null
                        inputPassword.error = null
                    }
                }
            }
        }
    }

    private fun attemptLogin() {
        val password = inputPassword.editText?.text?.toString().orEmpty()
        inputPassword.error = if (password.isEmpty()) getString(R.string.error_password_required) else null

        if (isOperatorMode) {
            val email = inputEmail.editText?.text?.toString()?.trim().orEmpty()
            inputEmail.error = if (email.isEmpty()) getString(R.string.error_email_required) else null

            if (email.isNotEmpty() && password.isNotEmpty()) {
                viewModel.loginOperator(email, password)
            }
        } else {
            val nic = inputNic.editText?.text?.toString()?.trim().orEmpty()
            inputNic.error = if (nic.isEmpty()) getString(R.string.error_nic_required) else null

            if (nic.isNotEmpty() && password.isNotEmpty()) {
                viewModel.loginProsumer(nic, password)
            }
        }
    }

    private fun showServerSettingsDialog() {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_server_settings, null)
        val editBaseUrl = dialogView.findViewById<TextInputEditText>(R.id.editBaseUrl)
        editBaseUrl.setText(sessionManager.getBaseUrl())

        MaterialAlertDialogBuilder(this)
            .setView(dialogView)
            .setPositiveButton(R.string.save) { _, _ ->
                val newUrl = editBaseUrl.text?.toString()?.trim()
                if (!newUrl.isNullOrBlank()) {
                    sessionManager.setBaseUrl(newUrl)
                    ApiClient.resetClient()
                    Toast.makeText(this, "Base URL updated: $newUrl", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
    }
}

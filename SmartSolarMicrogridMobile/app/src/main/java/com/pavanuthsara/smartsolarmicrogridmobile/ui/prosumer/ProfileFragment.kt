package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import com.google.android.material.button.MaterialButton
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.textfield.TextInputLayout
import com.pavanuthsara.smartsolarmicrogridmobile.R
import com.pavanuthsara.smartsolarmicrogridmobile.data.session.SessionManager

/**
 * ProfileFragment (Prosumer) — edit profile data, logout, and account deactivation.
 * ViewModel is initialised in onViewCreated() using ViewModelProvider(requireActivity())
 * so that the AndroidViewModel correctly receives the Application reference.
 */
class ProfileFragment : Fragment() {

    private lateinit var viewModel: ProsumerProfileViewModel
    private lateinit var sessionManager: SessionManager

    private lateinit var textProfileName: TextView
    private lateinit var textProfileNic: TextView
    private lateinit var inputNic: TextInputLayout
    private lateinit var inputFullName: TextInputLayout
    private lateinit var inputEmail: TextInputLayout
    private lateinit var inputPhone: TextInputLayout

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? = inflater.inflate(R.layout.fragment_profile, container, false)

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Initialise ViewModel — requireActivity() is the ViewModelStoreOwner and
        // supplies the Application to the AndroidViewModel constructor.
        viewModel      = ViewModelProvider(requireActivity())[ProsumerProfileViewModel::class.java]
        sessionManager = SessionManager.getInstance(requireContext())

        textProfileName = view.findViewById(R.id.textProfileName)
        textProfileNic  = view.findViewById(R.id.textProfileNic)
        inputNic        = view.findViewById(R.id.inputNic)
        inputFullName   = view.findViewById(R.id.inputFullName)
        inputEmail      = view.findViewById(R.id.inputEmail)
        inputPhone      = view.findViewById(R.id.inputPhone)

        // Resolve logged-in NIC: SessionManager first, then legacy prefs
        val loggedInNic = sessionManager.getUserId()
            ?: requireContext()
                .getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
                .getString("logged_in_nic", null)

        if (loggedInNic == null) {
            Toast.makeText(requireContext(), "Session expired. Please log in again.", Toast.LENGTH_SHORT).show()
            redirectToLogin()
            return
        }

        // Load profile only if not already loaded (avoids reload on tab re-select)
        if (viewModel.profileStatus.value == ProfileStatus.Idle) {
            viewModel.loadProfile(loggedInNic)
        }

        // ── Button wiring ─────────────────────────────────────────────────────

        view.findViewById<MaterialButton>(R.id.buttonSave).setOnClickListener {
            attemptUpdate()
        }

        view.findViewById<MaterialButton>(R.id.buttonDeactivate).setOnClickListener {
            showDeactivateDialog()
        }

        view.findViewById<MaterialButton>(R.id.buttonLogout).setOnClickListener {
            showLogoutDialog()
        }

        // ── Observe ───────────────────────────────────────────────────────────

        viewModel.profileStatus.observe(viewLifecycleOwner) { status ->
            when (status) {
                is ProfileStatus.Loaded -> {
                    textProfileName.text = status.prosumer.fullName
                    textProfileNic.text  = status.prosumer.nic
                    inputNic.editText?.setText(status.prosumer.nic)
                    inputFullName.editText?.setText(status.prosumer.fullName)
                    inputEmail.editText?.setText(status.prosumer.email)
                    inputPhone.editText?.setText(status.prosumer.phoneNumber)
                }
                is ProfileStatus.UpdateSuccess -> {
                    Toast.makeText(requireContext(), "Profile updated successfully!", Toast.LENGTH_SHORT).show()
                }
                is ProfileStatus.DeactivateSuccess -> {
                    Toast.makeText(requireContext(), "Account deactivated.", Toast.LENGTH_SHORT).show()
                    clearSessionAndLogout()
                }
                is ProfileStatus.Error -> {
                    Toast.makeText(requireContext(), status.message, Toast.LENGTH_LONG).show()
                }
                ProfileStatus.Loading, ProfileStatus.Idle -> Unit
            }
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private fun attemptUpdate() {
        val fullName = inputFullName.editText?.text?.toString()?.trim().orEmpty()
        val email    = inputEmail.editText?.text?.toString()?.trim().orEmpty()
        val phone    = inputPhone.editText?.text?.toString()?.trim().orEmpty()

        inputFullName.error = if (fullName.isEmpty()) getString(R.string.error_full_name_required) else null
        inputEmail.error    = when {
            email.isEmpty()                                    -> getString(R.string.error_email_required)
            !ProsumerRegistrationViewModel.isValidEmail(email) -> getString(R.string.error_email_invalid)
            else                                               -> null
        }
        inputPhone.error    = when {
            phone.isEmpty()                                          -> getString(R.string.error_phone_required)
            !ProsumerRegistrationViewModel.isValidPhoneNumber(phone) -> getString(R.string.error_phone_invalid)
            else                                                     -> null
        }

        val isValid = listOf(inputFullName, inputEmail, inputPhone).none { !it.error.isNullOrEmpty() }
        if (isValid) viewModel.updateProfile(fullName, email, phone)
    }

    private fun showDeactivateDialog() {
        AlertDialog.Builder(requireContext())
            .setTitle("Deactivate Account")
            .setMessage("Are you sure you want to deactivate your account? All data will be permanently deleted.")
            .setPositiveButton("Deactivate") { _, _ -> viewModel.deactivateAccount() }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showLogoutDialog() {
        MaterialAlertDialogBuilder(requireContext())
            .setTitle("Log Out")
            .setMessage("Are you sure you want to log out?")
            .setPositiveButton("Log Out") { _, _ -> clearSessionAndLogout() }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun clearSessionAndLogout() {
        sessionManager.clearSession()
        requireContext()
            .getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
            .edit()
            .remove("logged_in_nic")
            .remove("user_role")
            .apply()
        redirectToLogin()
    }

    private fun redirectToLogin() {
        startActivity(Intent(requireContext(), ProsumerLoginActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        })
    }
}

package com.pavanuthsara.smartsolarmicrogridmobile.ui.operator

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import androidx.fragment.app.Fragment
import com.google.android.material.button.MaterialButton
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.pavanuthsara.smartsolarmicrogridmobile.R
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.ApiClient
import com.pavanuthsara.smartsolarmicrogridmobile.data.session.SessionManager
import com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer.ProsumerLoginActivity
import com.google.android.material.textfield.TextInputEditText
import android.widget.Toast

/**
 * OperatorProfileFragment — displays operator info, server settings, and logout.
 */
class OperatorProfileFragment : Fragment() {

    private lateinit var sessionManager: SessionManager

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? = inflater.inflate(R.layout.fragment_operator_profile, container, false)

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        sessionManager = SessionManager.getInstance(requireContext())

        view.findViewById<TextView>(R.id.textOperatorProfileName).text =
            sessionManager.getFullName() ?: "Grid Operator"
        view.findViewById<TextView>(R.id.textOperatorProfileEmail).text =
            sessionManager.getEmail() ?: "operator@microgrid.com"
        view.findViewById<TextView>(R.id.badgeOperatorRole).text =
            (sessionManager.getRole() ?: "OPERATOR").uppercase()

        view.findViewById<LinearLayout>(R.id.rowServerSettings).setOnClickListener {
            showServerSettingsDialog()
        }

        view.findViewById<MaterialButton>(R.id.buttonLogout).setOnClickListener {
            confirmLogout()
        }
    }

    private fun confirmLogout() {
        MaterialAlertDialogBuilder(requireContext())
            .setTitle("Confirm Logout")
            .setMessage("Are you sure you want to end your operator session?")
            .setPositiveButton("Logout") { _, _ ->
                sessionManager.clearSession()
                startActivity(Intent(requireContext(), ProsumerLoginActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                })
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showServerSettingsDialog() {
        val dialogView = LayoutInflater.from(requireContext())
            .inflate(R.layout.dialog_server_settings, null)
        val editBaseUrl = dialogView.findViewById<TextInputEditText>(R.id.editBaseUrl)
        editBaseUrl.setText(sessionManager.getBaseUrl())

        MaterialAlertDialogBuilder(requireContext())
            .setView(dialogView)
            .setPositiveButton(R.string.save) { _, _ ->
                val newUrl = editBaseUrl.text?.toString()?.trim()
                if (!newUrl.isNullOrBlank()) {
                    sessionManager.setBaseUrl(newUrl)
                    ApiClient.resetClient()
                    Toast.makeText(requireContext(), "Base URL updated: $newUrl", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
    }
}

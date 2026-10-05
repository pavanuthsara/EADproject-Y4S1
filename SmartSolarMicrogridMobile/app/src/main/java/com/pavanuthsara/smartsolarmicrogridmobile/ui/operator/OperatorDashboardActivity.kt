package com.pavanuthsara.smartsolarmicrogridmobile.ui.operator

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.lifecycleScope
import com.google.android.material.button.MaterialButton
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanIntentResult
import com.journeyapps.barcodescanner.ScanOptions
import com.pavanuthsara.smartsolarmicrogridmobile.R
import com.pavanuthsara.smartsolarmicrogridmobile.data.session.SessionManager
import com.pavanuthsara.smartsolarmicrogridmobile.data.session.UserSession
import com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer.ProsumerLoginActivity
import kotlinx.coroutines.launch

class OperatorDashboardActivity : AppCompatActivity() {

    private val viewModel: OperatorViewModel by viewModels()
    private lateinit var sessionManager: SessionManager
    private lateinit var userSession: UserSession

    private lateinit var textOperatorName: TextView
    private lateinit var textOperatorEmail: TextView
    private lateinit var badgeRole: TextView
    private lateinit var textLastActionStatus: TextView

    private var activeVerificationDialog: AlertDialog? = null
    private var currentReservationId: String? = null
    private var isSigningOut = false

    // Register ZXing barcode scanner contract
    private val barcodeLauncher = registerForActivityResult(ScanContract()) { result: ScanIntentResult ->
        if (result.contents == null) {
            Toast.makeText(this, "Scan cancelled", Toast.LENGTH_SHORT).show()
        } else {
            val scannedToken = result.contents.trim()
            handleScannedQrToken(scannedToken)
        }
    }

    // Camera permission launcher
    private val requestCameraPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted: Boolean ->
            if (isGranted) {
                launchScanner()
            } else {
                Toast.makeText(this, getString(R.string.camera_permission_required), Toast.LENGTH_LONG).show()
            }
        }

    // Sets up the operator dashboard; returns to login if the session is missing or expired.
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_operator_dashboard)

        sessionManager = SessionManager.getInstance(this)
        userSession = UserSession(this)

        // Session check: ensure operator is authenticated
        if (!sessionManager.isLoggedIn()) {
            redirectToLogin()
            return
        }

        val rootView = findViewById<View>(R.id.operatorDashboardRoot)
        ViewCompat.setOnApplyWindowInsetsListener(rootView) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        textOperatorName = findViewById(R.id.textOperatorName)
        textOperatorEmail = findViewById(R.id.textOperatorEmail)
        badgeRole = findViewById(R.id.badgeRole)
        textLastActionStatus = findViewById(R.id.textLastActionStatus)

        // Populate operator information from the profile cached at sign-in
        lifecycleScope.launch {
            val user = userSession.currentUser()
            if (user == null) {
                redirectToLogin()
                return@launch
            }
            textOperatorName.text = user.fullName
            textOperatorEmail.text = user.email
            badgeRole.text = user.role.uppercase()
        }

        findViewById<MaterialButton>(R.id.buttonLogout).setOnClickListener {
            confirmLogout()
        }

        findViewById<MaterialButton>(R.id.buttonScanQr).setOnClickListener {
            checkCameraPermissionAndScan()
        }
    }

    // Starts the QR scanner, asking for camera permission first if needed.
    private fun checkCameraPermissionAndScan() {
        when {
            ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED -> {
                launchScanner()
            }
            shouldShowRequestPermissionRationale(Manifest.permission.CAMERA) -> {
                MaterialAlertDialogBuilder(this)
                    .setTitle("Camera Access Required")
                    .setMessage(getString(R.string.camera_permission_required))
                    .setPositiveButton("Grant") { _, _ ->
                        requestCameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                    }
                    .setNegativeButton("Cancel", null)
                    .show()
            }
            else -> {
                requestCameraPermissionLauncher.launch(Manifest.permission.CAMERA)
            }
        }
    }

    // Opens the camera to scan a prosumer reservation QR code.
    private fun launchScanner() {
        val options = ScanOptions().apply {
            setDesiredBarcodeFormats(ScanOptions.QR_CODE)
            setPrompt("Align Prosumer QR code inside viewfinder")
            setCameraId(0)
            setBeepEnabled(true)
            setBarcodeImageEnabled(false)
            setOrientationLocked(true)
        }
        barcodeLauncher.launch(options)
    }

    // Starts verifying a scanned QR token and shows the verification dialog.
    private fun handleScannedQrToken(qrToken: String) {
        viewModel.resetStates()
        showVerificationDialog(qrToken)
        viewModel.verifyQrToken(qrToken)
    }

    // Shows the dialog that follows QR verification and transfer completion.
    private fun showVerificationDialog(qrToken: String) {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_verify_transfer, null)

        val containerLoading = dialogView.findViewById<LinearLayout>(R.id.containerLoading)
        val containerError = dialogView.findViewById<LinearLayout>(R.id.containerError)
        val containerVerified = dialogView.findViewById<LinearLayout>(R.id.containerVerified)
        val containerCompleteSuccess = dialogView.findViewById<LinearLayout>(R.id.containerCompleteSuccess)

        val textErrorMessage = dialogView.findViewById<TextView>(R.id.textErrorMessage)
        val buttonCloseError = dialogView.findViewById<MaterialButton>(R.id.buttonCloseError)

        val textReservationNo = dialogView.findViewById<TextView>(R.id.textReservationNo)
        val badgeStatus = dialogView.findViewById<TextView>(R.id.badgeStatus)
        val textProsumerNic = dialogView.findViewById<TextView>(R.id.textProsumerNic)
        val textDirection = dialogView.findViewById<TextView>(R.id.textDirection)
        val textEnergyKwh = dialogView.findViewById<TextView>(R.id.textEnergyKwh)
        val textSlotTime = dialogView.findViewById<TextView>(R.id.textSlotTime)
        val textStationId = dialogView.findViewById<TextView>(R.id.textStationId)

        val buttonConfirmFinalize = dialogView.findViewById<MaterialButton>(R.id.buttonConfirmFinalize)
        val buttonCancel = dialogView.findViewById<MaterialButton>(R.id.buttonCancel)

        val textCompleteTimestamp = dialogView.findViewById<TextView>(R.id.textCompleteTimestamp)
        val buttonDoneSuccess = dialogView.findViewById<MaterialButton>(R.id.buttonDoneSuccess)

        val dialog = MaterialAlertDialogBuilder(this)
            .setView(dialogView)
            .setCancelable(false)
            .create()

        activeVerificationDialog = dialog
        dialog.show()

        buttonCancel.setOnClickListener {
            dialog.dismiss()
        }

        buttonCloseError.setOnClickListener {
            dialog.dismiss()
        }

        buttonDoneSuccess.setOnClickListener {
            dialog.dismiss()
        }

        buttonConfirmFinalize.setOnClickListener {
            val resId = currentReservationId
            if (!resId.isNullOrBlank()) {
                viewModel.completeTransfer(resId)
            } else {
                Toast.makeText(this, "Missing reservation ID", Toast.LENGTH_SHORT).show()
            }
        }

        // Observe Verification State
        viewModel.verifyState.observe(this) { state ->
            when (state) {
                is VerifyState.Loading -> {
                    containerLoading.visibility = View.VISIBLE
                    containerError.visibility = View.GONE
                    containerVerified.visibility = View.GONE
                    containerCompleteSuccess.visibility = View.GONE
                }
                is VerifyState.Success -> {
                    val dto = state.data
                    currentReservationId = dto.reservationId

                    containerLoading.visibility = View.GONE
                    containerError.visibility = View.GONE
                    containerVerified.visibility = View.VISIBLE
                    containerCompleteSuccess.visibility = View.GONE

                    textReservationNo.text = dto.reservationNo
                    badgeStatus.text = dto.status.uppercase()
                    textProsumerNic.text = dto.prosumerNic
                    textDirection.text = dto.direction
                    textEnergyKwh.text = "${dto.requestedKwh} kWh"
                    textSlotTime.text = dto.slotStartTime.replace("T", " ").take(16)
                    textStationId.text = dto.stationId
                }
                is VerifyState.Error -> {
                    if (state.sessionExpired) {
                        dialog.dismiss()
                        endExpiredSession()
                        return@observe
                    }
                    containerLoading.visibility = View.GONE
                    containerError.visibility = View.VISIBLE
                    containerVerified.visibility = View.GONE
                    containerCompleteSuccess.visibility = View.GONE

                    textErrorMessage.text = state.message
                    textLastActionStatus.text = "Last scan failed: ${state.message}"
                }
                VerifyState.Idle -> Unit
            }
        }

        // Observe Transfer Completion State
        viewModel.completeState.observe(this) { state ->
            when (state) {
                is CompleteState.Loading -> {
                    buttonConfirmFinalize.isEnabled = false
                    buttonConfirmFinalize.text = "Finalizing Transfer..."
                }
                is CompleteState.Success -> {
                    buttonConfirmFinalize.isEnabled = true
                    containerLoading.visibility = View.GONE
                    containerError.visibility = View.GONE
                    containerVerified.visibility = View.GONE
                    containerCompleteSuccess.visibility = View.VISIBLE

                    textCompleteTimestamp.text = "Completed: ${state.data.completedAt.replace("T", " ").take(19)} UTC"
                    textLastActionStatus.text = "Successfully finalized transfer ${state.data.reservationNo}"
                    Toast.makeText(this, "Energy transfer finalized successfully!", Toast.LENGTH_SHORT).show()
                }
                is CompleteState.Error -> {
                    if (state.sessionExpired) {
                        dialog.dismiss()
                        endExpiredSession()
                        return@observe
                    }
                    buttonConfirmFinalize.isEnabled = true
                    buttonConfirmFinalize.text = getString(R.string.finalize_transfer)
                    Toast.makeText(this, "Completion failed: ${state.message}", Toast.LENGTH_LONG).show()
                }
                CompleteState.Idle -> {
                    buttonConfirmFinalize.isEnabled = true
                    buttonConfirmFinalize.text = getString(R.string.finalize_transfer)
                }
            }
        }
    }

    // Asks for confirmation before signing the operator out.
    private fun confirmLogout() {
        MaterialAlertDialogBuilder(this)
            .setTitle("Confirm Logout")
            .setMessage("Are you sure you want to end your operator session?")
            .setPositiveButton("Logout") { _, _ ->
                signOutAndReturnToLogin()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    // The API rejected the token (401): clear the local session and ask the operator to sign in again.
    private fun endExpiredSession() {
        if (isSigningOut) return
        Toast.makeText(this, "Your session has expired. Please sign in again.", Toast.LENGTH_LONG).show()
        signOutAndReturnToLogin()
    }

    // Signs out once (ignoring repeat taps) and returns to the login screen.
    private fun signOutAndReturnToLogin() {
        if (isSigningOut) return
        isSigningOut = true
        lifecycleScope.launch {
            userSession.signOut()
            redirectToLogin()
        }
    }

    // Opens the login screen and clears the back stack.
    private fun redirectToLogin() {
        val intent = Intent(this, ProsumerLoginActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }

    // Closes any open verification dialog so it does not leak.
    override fun onDestroy() {
        super.onDestroy()
        activeVerificationDialog?.dismiss()
    }
}

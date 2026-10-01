package com.pavanuthsara.smartsolarmicrogridmobile.ui.operator

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import com.google.android.material.button.MaterialButton
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanIntentResult
import com.journeyapps.barcodescanner.ScanOptions
import com.pavanuthsara.smartsolarmicrogridmobile.R

/**
 * ScannerFragment — operator QR scanning tab.
 * Handles camera permission, ZXing QR scan, verification, and finalization.
 */
class ScannerFragment : Fragment() {

    private val viewModel: OperatorViewModel by lazy {
        ViewModelProvider(this)[OperatorViewModel::class.java]
    }

    private lateinit var buttonScanQr: MaterialButton
    private lateinit var textLastActionStatus: TextView

    private var activeDialog: androidx.appcompat.app.AlertDialog? = null
    private var currentReservationId: String? = null

    // ZXing scanner launcher
    private val barcodeLauncher = registerForActivityResult(ScanContract()) { result: ScanIntentResult ->
        if (result.contents == null) {
            Toast.makeText(requireContext(), "Scan cancelled", Toast.LENGTH_SHORT).show()
        } else {
            handleScannedToken(result.contents.trim())
        }
    }

    // Camera permission launcher
    private val cameraPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            if (granted) launchScanner()
            else Toast.makeText(requireContext(), getString(R.string.camera_permission_required), Toast.LENGTH_LONG).show()
        }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? = inflater.inflate(R.layout.fragment_operator_scanner, container, false)

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        buttonScanQr          = view.findViewById(R.id.buttonScanQr)
        textLastActionStatus  = view.findViewById(R.id.textLastActionStatus)

        buttonScanQr.setOnClickListener { checkCameraPermissionAndScan() }
    }

    // ── Camera & Scanner ──────────────────────────────────────────────────────

    private fun checkCameraPermissionAndScan() {
        when {
            ContextCompat.checkSelfPermission(requireContext(), Manifest.permission.CAMERA)
                    == PackageManager.PERMISSION_GRANTED -> launchScanner()

            shouldShowRequestPermissionRationale(Manifest.permission.CAMERA) -> {
                MaterialAlertDialogBuilder(requireContext())
                    .setTitle("Camera Access Required")
                    .setMessage(getString(R.string.camera_permission_required))
                    .setPositiveButton("Grant") { _, _ ->
                        cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                    }
                    .setNegativeButton("Cancel", null)
                    .show()
            }

            else -> cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

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

    private fun handleScannedToken(qrToken: String) {
        viewModel.resetStates()
        showVerificationDialog(qrToken)
        viewModel.verifyQrToken(qrToken)
    }

    // ── Verification Dialog ───────────────────────────────────────────────────

    private fun showVerificationDialog(qrToken: String) {
        val dialogView = LayoutInflater.from(requireContext())
            .inflate(R.layout.dialog_verify_transfer, null)

        val containerLoading         = dialogView.findViewById<LinearLayout>(R.id.containerLoading)
        val containerError           = dialogView.findViewById<LinearLayout>(R.id.containerError)
        val containerVerified        = dialogView.findViewById<LinearLayout>(R.id.containerVerified)
        val containerCompleteSuccess = dialogView.findViewById<LinearLayout>(R.id.containerCompleteSuccess)

        val textErrorMessage   = dialogView.findViewById<TextView>(R.id.textErrorMessage)
        val buttonCloseError   = dialogView.findViewById<MaterialButton>(R.id.buttonCloseError)
        val textReservationNo  = dialogView.findViewById<TextView>(R.id.textReservationNo)
        val badgeStatus        = dialogView.findViewById<TextView>(R.id.badgeStatus)
        val textProsumerNic    = dialogView.findViewById<TextView>(R.id.textProsumerNic)
        val textDirection      = dialogView.findViewById<TextView>(R.id.textDirection)
        val textEnergyKwh      = dialogView.findViewById<TextView>(R.id.textEnergyKwh)
        val textSlotTime       = dialogView.findViewById<TextView>(R.id.textSlotTime)
        val textStationId      = dialogView.findViewById<TextView>(R.id.textStationId)
        val buttonConfirm      = dialogView.findViewById<MaterialButton>(R.id.buttonConfirmFinalize)
        val buttonCancel       = dialogView.findViewById<MaterialButton>(R.id.buttonCancel)
        val textCompleteTs     = dialogView.findViewById<TextView>(R.id.textCompleteTimestamp)
        val buttonDone         = dialogView.findViewById<MaterialButton>(R.id.buttonDoneSuccess)

        val dialog = MaterialAlertDialogBuilder(requireContext())
            .setView(dialogView)
            .setCancelable(false)
            .create()

        activeDialog = dialog
        dialog.show()

        buttonCancel.setOnClickListener     { dialog.dismiss() }
        buttonCloseError.setOnClickListener { dialog.dismiss() }
        buttonDone.setOnClickListener       { dialog.dismiss() }

        buttonConfirm.setOnClickListener {
            currentReservationId?.let { id ->
                viewModel.completeTransfer(id)
            } ?: Toast.makeText(requireContext(), "Missing reservation ID", Toast.LENGTH_SHORT).show()
        }

        viewModel.verifyState.observe(viewLifecycleOwner) { state ->
            when (state) {
                is VerifyState.Loading -> {
                    containerLoading.visibility         = View.VISIBLE
                    containerError.visibility           = View.GONE
                    containerVerified.visibility        = View.GONE
                    containerCompleteSuccess.visibility = View.GONE
                }
                is VerifyState.Success -> {
                    val dto = state.data
                    currentReservationId = dto.reservationId
                    containerLoading.visibility         = View.GONE
                    containerError.visibility           = View.GONE
                    containerVerified.visibility        = View.VISIBLE
                    containerCompleteSuccess.visibility = View.GONE

                    textReservationNo.text = dto.reservationNo
                    badgeStatus.text       = dto.status.uppercase()
                    textProsumerNic.text   = dto.prosumerNic
                    textDirection.text     = dto.direction
                    textEnergyKwh.text     = "${dto.requestedKwh} kWh"
                    textSlotTime.text      = dto.slotStartTime.replace("T", " ").take(16)
                    textStationId.text     = dto.stationId
                }
                is VerifyState.Error -> {
                    containerLoading.visibility         = View.GONE
                    containerError.visibility           = View.VISIBLE
                    containerVerified.visibility        = View.GONE
                    containerCompleteSuccess.visibility = View.GONE
                    textErrorMessage.text               = state.message
                    textLastActionStatus.text           = "Last scan failed: ${state.message}"
                }
                VerifyState.Idle -> Unit
            }
        }

        viewModel.completeState.observe(viewLifecycleOwner) { state ->
            when (state) {
                is CompleteState.Loading -> {
                    buttonConfirm.isEnabled = false
                    buttonConfirm.text      = "Finalizing Transfer…"
                }
                is CompleteState.Success -> {
                    buttonConfirm.isEnabled             = true
                    containerLoading.visibility         = View.GONE
                    containerError.visibility           = View.GONE
                    containerVerified.visibility        = View.GONE
                    containerCompleteSuccess.visibility = View.VISIBLE
                    textCompleteTs.text = "Completed: ${state.data.completedAt.replace("T", " ").take(19)} UTC"
                    textLastActionStatus.text = "Successfully finalized transfer ${state.data.reservationNo}"
                    Toast.makeText(requireContext(), "Energy transfer finalized!", Toast.LENGTH_SHORT).show()
                }
                is CompleteState.Error -> {
                    buttonConfirm.isEnabled = true
                    buttonConfirm.text      = getString(R.string.finalize_transfer)
                    Toast.makeText(requireContext(), "Completion failed: ${state.message}", Toast.LENGTH_LONG).show()
                }
                CompleteState.Idle -> {
                    buttonConfirm.isEnabled = true
                    buttonConfirm.text      = getString(R.string.finalize_transfer)
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        activeDialog?.dismiss()
        activeDialog = null
    }
}

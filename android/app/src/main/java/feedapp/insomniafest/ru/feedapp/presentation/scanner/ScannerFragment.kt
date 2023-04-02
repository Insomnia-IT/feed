package feedapp.insomniafest.ru.feedapp.presentation.scanner

import android.Manifest
import android.os.Bundle
import android.os.CountDownTimer
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.google.zxing.BarcodeFormat
import com.google.zxing.Result
import feedapp.insomniafest.ru.feedapp.R
import feedapp.insomniafest.ru.feedapp.appComponent
import feedapp.insomniafest.ru.feedapp.common.util.PermissionUtils
import feedapp.insomniafest.ru.feedapp.common.util.observe
import feedapp.insomniafest.ru.feedapp.databinding.FragmentScannerBinding
import feedapp.insomniafest.ru.feedapp.domain.model.Volunteer
import feedapp.insomniafest.ru.feedapp.presentation.scanner.choice_scan_result.ChoiceScanResultDialogFragment
import feedapp.insomniafest.ru.feedapp.presentation.scanner.choice_scan_result.ChoiceScanResultStatus
import me.dm7.barcodescanner.zxing.ZXingScannerView


class ScannerFragment : Fragment(R.layout.fragment_scanner), ZXingScannerView.ResultHandler {
    private var _binding: FragmentScannerBinding? = null
    private val binding get() = _binding!!

    private lateinit var barcodeScanner: ZXingScannerView
    private lateinit var logOutTimer: CountDownTimer

    private val viewModel: ScannerViewModel by viewModels {
        requireContext().appComponent.scannerViewModelFactory()
    }

    companion object {
        private val REQUIRED_RUNTIME_PERMISSIONS = arrayOf(Manifest.permission.CAMERA)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (!PermissionUtils.allRuntimePermissionsGranted(
                requireActivity(),
                REQUIRED_RUNTIME_PERMISSIONS
            )
        ) {
            PermissionUtils.getRuntimePermissions(requireActivity(), REQUIRED_RUNTIME_PERMISSIONS)
        }

    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        super.onCreateView(inflater, container, savedInstanceState)
        _binding = FragmentScannerBinding.inflate(layoutInflater)

        logOutTimer = getLogOutTimer()
        logOutTimer.start()

        barcodeScanner = binding.scanner
        barcodeScanner.setResultHandler(this)
        setupFormats()
        setupScanner()

        observe(viewModel.viewEvents, ::processEvent)

        return binding.root
    }

    override fun onResume() {
        super.onResume()
        barcodeScanner.setResultHandler(this)
        setupScanner()
        barcodeScanner.startCamera()

        restartLogOutTimer()
    }

    override fun onPause() {
        super.onPause()
        barcodeScanner.stopCamera()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null

        logOutTimer.cancel()
    }

    private fun setupScanner() {
        barcodeScanner.setAutoFocus(true) // автофокус
        barcodeScanner.flash = true // вспышка
    }

    private fun setupFormats() {
        val formats = listOf(BarcodeFormat.QR_CODE)

        barcodeScanner.setFormats(formats)
    }

    override fun handleResult(result: Result?) {
        Log.d("!@#$", "Result:${result?.text}")

        viewModel.onQrScanned(result?.text.orEmpty())
    }

    private fun processEvent(event: ScannerEvent) = when (event) {
        is ScannerEvent.Error -> {
            showToast(getString(R.string.load_error, event.error))
        }
        is ScannerEvent.ContinueScan -> {
            binding.numberFed.text = event.numberFed.toString()
            showToast(message = event.message)
            barcodeScanner.resumeCameraPreview(this)
            restartLogOutTimer()
        }
        is ScannerEvent.SuccessScanAndContinue -> showChoiceForSuccessResult(event.volunteer)
        is ScannerEvent.ErrorScanAndContinue -> showChoiceForErrorResult(
            event.volunteer,
            event.error
        )
        is ScannerEvent.BlockingErrorScan -> showChoiceForBlockingErrorResult(
            event.volunteer,
            event.error
        )
    }

    private fun showToast(message: String) {
        Toast.makeText(
            context,
            message,
            Toast.LENGTH_LONG
        ).show()
    }

    private fun showChoiceForSuccessResult(volunteer: Volunteer) {
        ChoiceScanResultDialogFragment(
            volunteer = volunteer,
            title = "Волонтера можно кормить",
            message = "Кормление произойдет автоматически",
            status = ChoiceScanResultStatus.SUCCESS,
            textLeftButton = "Кормить",
            textRightButton = "Отмена",
            onLeftClickListener = viewModel::onScanResultAddTransaction,
            onRightClickListener = viewModel::onScanResultCancelTransaction,
        ).show(requireActivity().supportFragmentManager, "ChoiceScanResultDialogFragment")
    }

    private fun showChoiceForErrorResult(volunteer: Volunteer, error: String) {
        ChoiceScanResultDialogFragment(
            volunteer = volunteer,
            title = "Можно кормить в долг",
            message = error,
            status = ChoiceScanResultStatus.ERROR,
            textLeftButton = "Отмена",
            textRightButton = "Кормить в долг",
            onLeftClickListener = viewModel::onScanResultCancelTransaction,
            onRightClickListener = viewModel::onScanResultAddTransaction,
        ).show(requireActivity().supportFragmentManager, "ChoiceScanResultDialogFragment")
    }

    private fun showChoiceForBlockingErrorResult(volunteer: Volunteer?, error: String) {
        ChoiceScanResultDialogFragment(
            volunteer = volunteer,
            title = "Кормить нельзя",
            message = error,
            status = ChoiceScanResultStatus.BLOCKING_ERROR,
            textLeftButton = "Отмена",
            onLeftClickListener = viewModel::onScanResultCancelTransaction,
        ).show(requireActivity().supportFragmentManager, "ChoiceScanResultDialogFragment")
    }


    private fun getLogOutTimer(): CountDownTimer {
        val logOutInterval: Long = 60 * 60 * 1000 // час

        return object : CountDownTimer(logOutInterval, logOutInterval) {
            override fun onTick(p0: Long) {}

            override fun onFinish() {
                findNavController().navigate(R.id.loginFragment)
            }
        }
    }

    private fun restartLogOutTimer() {
        logOutTimer.cancel()
        logOutTimer.start()
    }
}

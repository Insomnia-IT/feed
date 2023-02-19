package feedapp.insomniafest.ru.feedapp.presentation.scanner

import android.Manifest
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.google.zxing.BarcodeFormat
import com.google.zxing.Result
import feedapp.insomniafest.ru.feedapp.R
import feedapp.insomniafest.ru.feedapp.common.util.PermissionUtils
import feedapp.insomniafest.ru.feedapp.databinding.FragmentScannerBinding
import me.dm7.barcodescanner.zxing.ZXingScannerView


class ScannerFragment : Fragment(R.layout.fragment_scanner), ZXingScannerView.ResultHandler {
    private var _binding: FragmentScannerBinding? = null
    private val binding get() = _binding!!

    private lateinit var barcodeScanner: ZXingScannerView

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

        barcodeScanner = binding.scanner
        barcodeScanner.setResultHandler(this)
        setupFormats()
        setupScanner()

        return binding.root
    }

    override fun onResume() {
        super.onResume()
        barcodeScanner.setResultHandler(this)
        setupScanner()
        barcodeScanner.startCamera()
    }

    override fun onPause() {
        super.onPause()
        barcodeScanner.stopCamera()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    private fun setupScanner() {
        barcodeScanner.setAutoFocus(true) // автофокус
        barcodeScanner.flash = false // вспышка TODO
    }

    private fun setupFormats() {
        val formats = listOf(BarcodeFormat.QR_CODE)

        barcodeScanner.setFormats(formats)
    }

    override fun handleResult(result: Result?) {
        Log.d("!@#$", "Result:${result?.text}")

        Toast.makeText(context, result?.text, Toast.LENGTH_SHORT).show()

        barcodeScanner.resumeCameraPreview(this)
    }

}
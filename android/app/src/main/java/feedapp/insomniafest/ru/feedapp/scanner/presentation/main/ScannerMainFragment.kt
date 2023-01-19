package feedapp.insomniafest.ru.feedapp.scanner.presentation.main

import android.Manifest
import android.content.res.Resources
import androidx.fragment.app.Fragment
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import com.buildtoapp.mlbarcodescanner.MLBarcodeCallback
import com.buildtoapp.mlbarcodescanner.MLBarcodeScanner
import feedapp.insomniafest.ru.feedapp.R
import feedapp.insomniafest.ru.feedapp.databinding.FragmentScannerBinding
import feedapp.insomniafest.ru.feedapp.util.PermissionUtils
import com.google.mlkit.vision.barcode.common.Barcode


class ScannerMainFragment : Fragment(R.layout.fragment_scanner), MLBarcodeCallback {
        private var _binding: FragmentScannerBinding? = null
    private val binding get() = _binding!!

    private lateinit var barcodeScanner: MLBarcodeScanner

    companion object {
        private val REQUIRED_RUNTIME_PERMISSIONS = arrayOf(Manifest.permission.CAMERA)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (!PermissionUtils.allRuntimePermissionsGranted(requireActivity(), REQUIRED_RUNTIME_PERMISSIONS)) {
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

        initBarcodeScanner()

        return binding.root
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    private fun initBarcodeScanner() {
        barcodeScanner = MLBarcodeScanner(
            callback = this,
            focusBoxSize = MetricUtils.dpToPx(264), // TODO
            graphicOverlay = binding.graphicOverlay,
            previewView = binding.previewViewCameraScanning,
            lifecycleOwner = this,
            context = requireContext(),
            drawOverlay = true,
            drawBanner = true,
            supportedBarcodeFormats = listOf(Barcode.FORMAT_QR_CODE)
        )
    }

    override fun onNewBarcodeScanned(displayValue: String, rawValue: String) {
        // todo: you can process your barcode here
    }
}

private object MetricUtils {
    fun dpToPx(dp: Int): Int {
        return (dp * Resources.getSystem().displayMetrics.density).toInt()
    }
}
package com.buildtoapp.mlbarcodescanner

import com.google.android.gms.tasks.Task
import com.google.mlkit.vision.barcode.BarcodeScanner
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage

internal class BarcodeScannerProcessor(
    private val callback: MLBarcodeCallback,
    private val focusBoxSize: Int,
    supportedBarcodeFormats: List<Int> = listOf(Barcode.FORMAT_ALL_FORMATS)
) : VisionProcessorBase<List<Barcode>>() {

    // Note that if you know which format of barcode your app is dealing with, detection will be
    // faster to specify the supported barcode formats one by one
    // TODO убрать ненужные типы
    private val barcodeScanner: BarcodeScanner = BarcodeScanning.getClient(
        if (supportedBarcodeFormats.size == 1) {
            BarcodeScannerOptions.Builder().setBarcodeFormats(supportedBarcodeFormats.first())
                .build()
        } else {
            val moreFormats = supportedBarcodeFormats
                .subList(1, supportedBarcodeFormats.size)
                .toIntArray()
            BarcodeScannerOptions.Builder()
                .setBarcodeFormats(supportedBarcodeFormats.first(), *moreFormats)
                .build()
        }
    )

    override fun stop() {
        super.stop()
        barcodeScanner.close()
    }

    override fun detectInImage(image: InputImage): Task<List<Barcode>> {
        return barcodeScanner.process(image)
    }

    override fun onSuccess(results: List<Barcode>, graphicOverlay: GraphicOverlay) {
        for (barcode in results) {
            val displayValue = barcode.displayValue
            val rawValue = barcode.rawValue
            if (displayValue != null && rawValue != null) { // TODO проверить, только ли в прицеле чекаются баркоды
                callback.onNewBarcodeScanned(displayValue, rawValue)
            }
        }
    }

    override fun onFailure(e: Exception) {
        // do nothing
    }
}

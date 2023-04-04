package feedapp.insomniafest.ru.feedapp.presentation.scanner

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import feedapp.insomniafest.ru.feedapp.common.util.BaseViewModel
import feedapp.insomniafest.ru.feedapp.common.util.NotNullMutableLiveData
import feedapp.insomniafest.ru.feedapp.common.util.delegate
import feedapp.insomniafest.ru.feedapp.domain.interactor.CreateTransactionInteractor
import feedapp.insomniafest.ru.feedapp.domain.interactor.SaveTransactionInteractor
import feedapp.insomniafest.ru.feedapp.domain.model.Volunteer
import javax.inject.Inject
import javax.inject.Provider

sealed class ScanResult {
    object Success : ScanResult()
    class CanContinue(val error: String) : ScanResult()
    class BlockContinue(val error: String) : ScanResult()
}

class ScannerViewModel @Inject constructor(
    private val createTransactionInteractor: CreateTransactionInteractor,
    private val saveTransactionInteractor: SaveTransactionInteractor,
) : BaseViewModel<ScannerEvent>() {

    private val _viewState = NotNullMutableLiveData(
        ScannerState(
            0, // TODO хранить нужно локально, чтобы выход не сбрасывал
        )
    )
    private var state by _viewState.delegate()

    fun onQrScanned(qr: String) {
        launchIO {
            runCatching {
                createTransactionInteractor.invoke(qr)
            }.onSuccess { (volunteer, scanResult) ->
                when (scanResult) {
                    ScanResult.Success -> ScannerEvent.SuccessScanAndContinue(volunteer).post()
                    is ScanResult.CanContinue -> {
                        ScannerEvent.ErrorScanAndContinue(volunteer, scanResult.error).post()
                    }
                    is ScanResult.BlockContinue -> {
                        ScannerEvent.BlockingErrorScan(volunteer, scanResult.error).post()
                    }
                }

            }.onFailure { error ->
                Log.e("!#@$", "Ошибика: ${error.message}")
                ScannerEvent.BlockingErrorScan(null, error.message.orEmpty()).post()
            }
        }
    }

    fun onAnonymousClick() {
        ScannerEvent.SuccessScanAndContinue(Volunteer.anonymous).post()
    }

    fun onBabyClick() {
        ScannerEvent.SuccessScanAndContinue(Volunteer.baby).post()
    }

    fun onScanResultAddTransaction() {
        val isSaveAnyway = true
        launchIO {
            runCatching {
                saveTransactionInteractor.invoke(isSaveAnyway)
            }.onSuccess {
                showThatWasFed()
            }.onFailure { error ->
                if (isSaveAnyway) {
                    showThatWasFed()
                } else {
                    Log.e("!#@$", "Ошибика: ${error.message}")
                    ScannerEvent.Error(error.message.orEmpty()).post()
                }
            }
        }
    }

    fun onScanResultCancelTransaction() {
        // TODO забыть транзакцию
        ScannerEvent.ContinueScan("Не покормлен", state.numberFed).post()
    }

    private fun showThatWasFed() {
        val curState = state as? ScannerState ?: return
        state = curState.copy(numberFed = curState.numberFed.inc())

        ScannerEvent.ContinueScan("Покормлен", state.numberFed).post()
    }

}

sealed class ScannerEvent {
    class Error(val error: String) : ScannerEvent()
    class SuccessScanAndContinue(val volunteer: Volunteer) : ScannerEvent()
    class ErrorScanAndContinue(val volunteer: Volunteer, val error: String) : ScannerEvent()
    class BlockingErrorScan(val volunteer: Volunteer?, val error: String) : ScannerEvent()
    class ContinueScan(val message: String, val numberFed: Int) : ScannerEvent()
}

internal data class ScannerState(
    val numberFed: Int, // TODO удалить
)

class ScannerViewModelFactory @Inject constructor(
    scannerViewModel: Provider<ScannerViewModel>
) : ViewModelProvider.Factory {
    private val providers = mapOf<Class<*>, Provider<out ViewModel>>(
        ScannerViewModel::class.java to scannerViewModel
    )

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return providers[modelClass]!!.get() as T
    }
}

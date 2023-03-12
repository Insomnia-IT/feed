package feedapp.insomniafest.ru.feedapp.presentation.scanner

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import feedapp.insomniafest.ru.feedapp.common.util.BaseViewModel
import feedapp.insomniafest.ru.feedapp.common.util.NotNullMutableLiveData
import feedapp.insomniafest.ru.feedapp.common.util.delegate
import feedapp.insomniafest.ru.feedapp.domain.interactor.CreateTransactionInteractor
import feedapp.insomniafest.ru.feedapp.domain.interactor.ScanError
import javax.inject.Inject
import javax.inject.Provider


class ScannerViewModel @Inject constructor(
    private val createTransactionInteractor: CreateTransactionInteractor,
) : BaseViewModel<ScannerEvent>() {

    private val _viewState = NotNullMutableLiveData(
        ScannerState(
            0, // TODO хранить нужно локально, чтобы перезагрузки не сбрасывали
        )
    )
    private var state by _viewState.delegate()

    fun onQrScanned(qr: String) {
        launchIO {
            runCatching {
                createTransactionInteractor.invoke(qr)
            }.onSuccess {
                ScannerEvent.SuccessScanAndContinue.post()
            }.onFailure { error ->
                Log.e("!#@$", "Ошибика: ${error.message}")
                when (error) {
                    is ScanError.BlockContinue -> ScannerEvent.ErrorScanAndContinue.post() // TODO сделать блокирующей
                    is ScanError.CanContinue -> ScannerEvent.ErrorScanAndContinue.post()
                    else -> ScannerEvent.Error(error.message.orEmpty())
                }
            }
        }
    }

    fun onScanResultAddTransaction() {
        // TODO сохранить транзакцию
        updateVolunteerCounter()
        ScannerEvent.ContinueScan("Покормлен", state.numberFed).post()
    }

    fun onScanResultCancelTransaction() {
        // TODO забыть транзакцию
        ScannerEvent.ContinueScan("Не покормлен", state.numberFed).post()
    }

    private fun updateVolunteerCounter() {
        val curState = state as? ScannerState ?: return
        state =
            curState.copy(numberFed = curState.numberFed.inc()) // TODO из-за post в state, счетчик не сразу обновляется
    }

}

sealed class ScannerEvent {
    class Error(val error: String) : ScannerEvent()
    object SuccessScanAndContinue : ScannerEvent()
    object ErrorScanAndContinue : ScannerEvent()
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

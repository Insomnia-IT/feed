package feedapp.insomniafest.ru.feedapp.presentation.scanner

import android.util.Log
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import feedapp.insomniafest.ru.feedapp.common.util.BaseViewModel
import feedapp.insomniafest.ru.feedapp.domain.model.Volunteer
import feedapp.insomniafest.ru.feedapp.domain.repository.VolunteersRepository
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Provider


class ScannerViewModel @Inject constructor(
    private val volunteersRepository: VolunteersRepository
) : BaseViewModel<ScannerEvent>() {

    private val _viewState = MutableLiveData(
        ScannerState(
            0,
            volunteersList = emptyList(),
            fedVolunteers = emptyList(),
        )
    )

    fun onQrScanned(value: String) {
        val curState = _viewState.value
        curState?.let {
            _viewState.value = curState.copy(numberFed = curState.numberFed.inc())
            ScannerEvent.UpdateVolunteerCounter(curState.numberFed.inc()).post()
        }
        // TODO анализ  qr
    }

    private fun loadVolunteers() {
        viewModelScope.launch {
            val curState = _viewState.value
            runCatching {
                volunteersRepository.getLocalVolunteersList()
            }.onSuccess {
                _viewState.value = curState?.copy(
                    volunteersList = it
                )
            }.onFailure {
                Log.e("ScannerViewModel", it.message.orEmpty())
                ScannerEvent.Error(it.message.orEmpty()).post()
            }
        }
    }

}

sealed class ScannerEvent {
    class Error(val error: String) : ScannerEvent()
    class UpdateVolunteerCounter(
        val numberFed: Int,
    ) : ScannerEvent()
}

internal data class ScannerState(
    val numberFed: Int, // TODO удалить
    val volunteersList: List<Volunteer>,
    val fedVolunteers: List<Volunteer>,
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

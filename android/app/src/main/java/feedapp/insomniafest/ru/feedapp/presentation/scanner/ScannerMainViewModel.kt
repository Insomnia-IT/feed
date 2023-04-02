package feedapp.insomniafest.ru.feedapp.presentation.scanner

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import feedapp.insomniafest.ru.feedapp.common.util.BaseViewModel
import feedapp.insomniafest.ru.feedapp.domain.model.EatingType
import feedapp.insomniafest.ru.feedapp.domain.repository.EatingTypeRepository
import java.util.*
import javax.inject.Inject
import javax.inject.Provider

class ScannerMainViewModel @Inject constructor(
    private val eatingTypeRepository: EatingTypeRepository
) : BaseViewModel<ScannerMainEvent>() {

    init {
        findOutEatingType()
    }

    fun onEatingTypeSelected(type: EatingType) {
        launchIO {
            eatingTypeRepository.saveEatingType(type)
        }
    }

    private fun findOutEatingType() {
        launchIO {
            runCatching {
                // логика для интерактора конечно же, но выносить ее мне влом
                val currentHour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)

                val type = when {
                    currentHour < 4 -> EatingType.LATE_DINNER
                    currentHour < 11 -> EatingType.BREAKFAST
                    currentHour < 16 -> EatingType.LUNCH
                    currentHour in 16..20 -> EatingType.DINNER
                    else -> EatingType.LATE_DINNER
                }
                eatingTypeRepository.saveEatingType(type)

                ScannerMainEvent.ShowChoicerEatingType(type).post()
            }
        }
    }
}

sealed class ScannerMainEvent {
    class ShowChoicerEatingType(val type: EatingType) : ScannerMainEvent()
}

class ScannerMainViewModelFactory @Inject constructor( // TODO когда-нибудь обязательно вынесу это
    scannerMainViewModel: Provider<ScannerMainViewModel>
) : ViewModelProvider.Factory {
    private val providers = mapOf<Class<*>, Provider<out ViewModel>>(
        ScannerMainViewModel::class.java to scannerMainViewModel
    )

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return providers[modelClass]!!.get() as T
    }
}

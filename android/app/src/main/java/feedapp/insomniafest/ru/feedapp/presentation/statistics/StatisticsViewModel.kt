package feedapp.insomniafest.ru.feedapp.presentation.statistics

import android.util.Log
import androidx.lifecycle.*
import feedapp.insomniafest.ru.feedapp.common.util.BaseViewModel
import feedapp.insomniafest.ru.feedapp.common.util.delegate
import feedapp.insomniafest.ru.feedapp.domain.interactor.GetStatisticsInteractor
import feedapp.insomniafest.ru.feedapp.domain.model.FeedType
import feedapp.insomniafest.ru.feedapp.domain.model.Statistics
import java.util.*
import javax.inject.Inject
import javax.inject.Provider

class StatisticsViewModel @Inject constructor(
    private val getStatisticsInteractor: GetStatisticsInteractor
) : BaseViewModel<StatisticsEvent>() {

    private val _viewState = MutableLiveData<StatisticsState>(null)
    private var state by _viewState.delegate()
    val viewState: LiveData<StatisticsState> = _viewState

    private val mCalendar = Calendar.getInstance()
    private val mYear = mCalendar.get(Calendar.YEAR)
    private val mMonth = mCalendar.get(Calendar.MONTH)
    private val mDay = mCalendar.get(Calendar.DAY_OF_MONTH)

    fun onResume() {
        loadStatistics(mYear, mMonth, mDay)
    }

    fun onToggleFeedType(feedType: FeedType) {
        loadStatistics(state.year, state.month, state.day, feedType)
    }

    fun loadStatistics(year: Int, month: Int, day: Int, feedType: FeedType = FeedType.UNKNOWN) {
        launchIO {
            runCatching {
                getStatisticsInteractor.invoke(year, month, day, feedType)
            }.onSuccess {
                state = StatisticsState(
                    year = year,
                    month = month,
                    day = day,
                    statistics = it,
                    selectFeedType = feedType,
                )
            }.onFailure {
                Log.e("StatisticsViewModel", it.message.orEmpty())
                StatisticsEvent.Error("Ошибка запроса в БД").post()
            }
        }
    }

}

sealed class StatisticsEvent {
    class Error(val error: String) : StatisticsEvent()
}

data class StatisticsState(
    val year: Int,
    val month: Int,
    val day: Int,
    val statistics: List<Statistics>,
    val selectFeedType: FeedType,
)

class StatisticsViewModelFactory @Inject constructor( // TODO пора уже вынести
    statisticsViewModel: Provider<StatisticsViewModel>
) : ViewModelProvider.Factory {
    private val providers = mapOf<Class<*>, Provider<out ViewModel>>(
        StatisticsViewModel::class.java to statisticsViewModel
    )

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return providers[modelClass]!!.get() as T
    }
}

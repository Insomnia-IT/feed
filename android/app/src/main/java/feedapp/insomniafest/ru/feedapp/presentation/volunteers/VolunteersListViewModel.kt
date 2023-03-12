package feedapp.insomniafest.ru.feedapp.presentation.volunteers

import android.util.Log
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import feedapp.insomniafest.ru.feedapp.common.util.BaseViewModel
import feedapp.insomniafest.ru.feedapp.common.util.delegate
import feedapp.insomniafest.ru.feedapp.domain.model.Volunteer
import feedapp.insomniafest.ru.feedapp.domain.repository.VolunteersRepository
import javax.inject.Inject
import javax.inject.Provider


class VolunteersListViewModel @Inject constructor(
    private val volunteersRepository: VolunteersRepository
) : BaseViewModel<VolunteersListEvent>() {

    private val _viewState = MutableLiveData<VolunteersState>(VolunteersState.Loading)

    //val viewState: LiveData<VolunteersState> = _viewState
    private var state by _viewState.delegate()


    init {
        getLocal()
    }

    fun onReloadVolunteers() {
        reloadVolunteers()
    }

    private fun reloadVolunteers() {
        launchIO {
            runCatching {
                volunteersRepository.updateVolunteersList()
                volunteersRepository.getLocalVolunteersList()
            }.onSuccess {
                state = VolunteersState.Loaded(
                    volunteerList = it
                )
                VolunteersListEvent.UpdateVolunteers(it).post()
            }.onFailure {
                Log.e("VolunteersListViewModel", it.message.orEmpty())
                VolunteersListEvent.ErrorLoading(it.message.orEmpty()).post()
            }
        }
    }

    private fun getLocal() {
        launchIO {
            runCatching {
                volunteersRepository.getLocalVolunteersList()
            }.onSuccess {
                state = VolunteersState.Loaded(
                    volunteerList = it
                )
                VolunteersListEvent.UpdateVolunteers(it).post()
            }.onFailure {
                Log.e("VolunteersListViewModel", it.message.orEmpty())
                VolunteersListEvent.ErrorLoading(it.message.orEmpty()).post()
            }
        }
    }
}

sealed class VolunteersListEvent {
    class ErrorLoading(val error: String) : VolunteersListEvent()
    class UpdateVolunteers(
        val volunteers: List<Volunteer>,
    ) : VolunteersListEvent()
}

sealed class VolunteersState {
    object Loading : VolunteersState()
    data class Loaded(
        val volunteerList: List<Volunteer>,
    ) : VolunteersState()
}

class ViewModelFactory @Inject constructor(
    volunteersListViewModel: Provider<VolunteersListViewModel>
) : ViewModelProvider.Factory {
    private val providers = mapOf<Class<*>, Provider<out ViewModel>>(
        VolunteersListViewModel::class.java to volunteersListViewModel
    )

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return providers[modelClass]!!.get() as T
    }
}

package feedapp.insomniafest.ru.feedapp.presentation.volunteers

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


class VolunteersListViewModel @Inject constructor(
    private val volunteersRepository: VolunteersRepository
) : BaseViewModel<VolunteersListEvent>() {

    private val _viewState = MutableLiveData<VolunteersState>(VolunteersState.Loading)
    //val viewState: LiveData<VolunteersState> = _viewState


    init {
        getLocalElseLoad()
    }

    fun onReloadVolunteers() {
        loadVolunteers()
    }

    private fun loadVolunteers() {
        viewModelScope.launch {
            runCatching {
                volunteersRepository.loadVolunteersList()
            }.onSuccess {
                _viewState.value = VolunteersState.Loaded(
                    volunteerList = it
                )
                VolunteersListEvent.UpdateVolunteers(it).post()
            }.onFailure {
                Log.e("VolunteersListViewModel", it.message.orEmpty())
                VolunteersListEvent.ErrorLoading(it.message.orEmpty()).post()
            }
        }
    }

    private fun getLocalElseLoad() {
        viewModelScope.launch {
            runCatching {
                volunteersRepository.getLocalElseLoad()
            }.onSuccess {
                _viewState.value = VolunteersState.Loaded(
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

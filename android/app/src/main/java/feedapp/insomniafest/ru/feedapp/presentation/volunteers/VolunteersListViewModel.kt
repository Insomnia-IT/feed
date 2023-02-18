package feedapp.insomniafest.ru.feedapp.presentation.volunteers

import android.util.Log
import androidx.lifecycle.*
import feedapp.insomniafest.ru.feedapp.domain.model.Volunteer
import feedapp.insomniafest.ru.feedapp.domain.repository.VolunteersRepository
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Provider


class VolunteersListViewModel @Inject constructor(
    val volunteersRepository: VolunteersRepository
) : ViewModel() {

    private val _viewState = MutableLiveData<VolunteersState>(VolunteersState.Loading)
    val viewState: LiveData<VolunteersState> = _viewState


    init {
        //loadInitial()
    }

    private fun loadInitial() {
        viewModelScope.launch {
            runCatching {
                volunteersRepository.getVolunteersList()
            }.onSuccess {
                _viewState.value = VolunteersState.Loaded(
                    volunteerList = it
                )
            }.onFailure {
                Log.e("VolunteersListViewModel", it.message.orEmpty())
            }
        }
    }
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

    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return providers[modelClass]!!.get() as T
    }
}

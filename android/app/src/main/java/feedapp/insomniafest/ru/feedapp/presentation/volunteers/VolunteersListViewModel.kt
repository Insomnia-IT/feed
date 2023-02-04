package feedapp.insomniafest.ru.feedapp.presentation.volunteers

import android.util.Log
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import feedapp.insomniafest.ru.feedapp.domain.model.Volunteer
import feedapp.insomniafest.ru.feedapp.domain.repository.VolunteersRepository
import kotlinx.coroutines.launch
import javax.inject.Inject

internal sealed class VolunteersState {
    object Loading : VolunteersState()
    data class Loaded(
        val volunteerList: List<Volunteer>,
    ) : VolunteersState()
}

internal class VolunteersListViewModel @Inject constructor(
    private val volunteersRepository: VolunteersRepository
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
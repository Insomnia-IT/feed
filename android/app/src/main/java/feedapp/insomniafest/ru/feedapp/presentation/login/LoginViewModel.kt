package feedapp.insomniafest.ru.feedapp.presentation.login

import android.util.Log
import androidx.lifecycle.*
import feedapp.insomniafest.ru.feedapp.common.util.BaseViewModel
import feedapp.insomniafest.ru.feedapp.domain.repository.VolunteersRepository
import javax.inject.Inject
import javax.inject.Provider

class LoginViewModel @Inject constructor(
    private val volunteersRepository: VolunteersRepository
) : BaseViewModel<LoginEvent>() {

    fun tryLogin(code: String) {
        launchIO {
            runCatching {
                volunteersRepository.checkLogin(code)
            }.onSuccess { isSuccessful ->
                if (isSuccessful) {
                    // TODO Сохранить логин в базу
                    LoginEvent.Successful.post()
                } else {
                    LoginEvent.Error("Некорректный логин").post()
                }
            }.onFailure {
                Log.e("VolunteersListViewModel", it.message.orEmpty())
                LoginEvent.Error(it.message.orEmpty()).post()
            }
        }
    }
}

sealed class LoginEvent {
    class Error(val error: String) : LoginEvent()
    object Successful : LoginEvent()
}

class LoginViewModelFactory @Inject constructor( // TODO пора уже вынести
    loginViewModel: Provider<LoginViewModel>
) : ViewModelProvider.Factory {
    private val providers = mapOf<Class<*>, Provider<out ViewModel>>(
        LoginViewModel::class.java to loginViewModel
    )

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return providers[modelClass]!!.get() as T
    }
}

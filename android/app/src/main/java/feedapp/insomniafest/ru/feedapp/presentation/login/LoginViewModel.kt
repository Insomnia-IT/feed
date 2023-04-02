package feedapp.insomniafest.ru.feedapp.presentation.login

import android.util.Log
import androidx.lifecycle.*
import feedapp.insomniafest.ru.feedapp.common.util.BaseViewModel
import feedapp.insomniafest.ru.feedapp.common.util.delegate
import feedapp.insomniafest.ru.feedapp.domain.repository.VolunteersRepository
import javax.inject.Inject
import javax.inject.Provider

class LoginViewModel @Inject constructor(
    private val volunteersRepository: VolunteersRepository
) : BaseViewModel<LoginEvent>() {

    private val _viewState = MutableLiveData<LoginState>(null)
    private var state by _viewState.delegate()
    val viewState: LiveData<LoginState> = _viewState

    init {
        loadLastUpdate()
    }

    fun loadLastUpdate() {
        launchIO {
            runCatching {
                volunteersRepository.getLastUpdate()
            }.onSuccess {
                state = LoginState(it)
            }
        }
    }

    fun tryLogin(code: String) {
        launchIO {
            runCatching {
                val formattedCode = code.filter { it.isDigit() }
                volunteersRepository.checkLogin(formattedCode) // При успехе логин сохраняется в sharedPreference
            }.onSuccess { isSuccessful ->
                if (isSuccessful) {
                    tryUpdateVolunteers()
                } else {
                    LoginEvent.Error("Некорректный логин").post()
                }
            }.onFailure {
                Log.e("LoginViewModel", it.message.orEmpty())
                LoginEvent.Error("Для проверки логина нужно интернет соединение")
                    .post()
            }
        }
    }

    private fun tryUpdateVolunteers() {
        launchIO {
            runCatching {
                volunteersRepository.updateVolunteersList()
            }.onSuccess {
                LoginEvent.Successful.post()
            }.onFailure {
                // был проверен логин по базе, инет соединения нет, обновиться не получилось,
                // но можно пускать дальше, если база свежая

                // проверяет, база текущего дня, если нет, сбрасывает все данные по логинам и волонтерам
                val wasReset = volunteersRepository.resetDatabaseIfNecessary()
                if (wasReset) {
                    LoginEvent.Error("Hеобходимо интернет соединение чтобы продолжить").post()
                } else {
                    LoginEvent.Successful.post()
                }
            }
        }
    }
}

sealed class LoginEvent {
    class Error(val error: String) : LoginEvent()
    object Successful : LoginEvent()
}

data class LoginState(val lastUpdate: String)

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

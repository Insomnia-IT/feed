package feedapp.insomniafest.ru.feedapp.common.util

import androidx.fragment.app.Fragment
import androidx.lifecycle.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlin.properties.ReadWriteProperty
import kotlin.reflect.KProperty

abstract class BaseViewModel<E : Any> : ViewModel() {
    enum class Loader {
        Hide, // не показываем лоадер
        HideOnSuccess, // скрываем лоадер только при успешной операции
        HideOnComplete // скрываем лоадер при успехе и ошибке
    }

    protected val mutableModalLoadingState = MutableLiveData(false)
    val modalLoadingState = mutableModalLoadingState.distinctUntilChanged()

    private val _viewEvents = SingleLiveEvent<E>()
    val viewEvents: LiveData<E> = _viewEvents

    protected fun E.post(immediately: Boolean = false) {
        if (immediately) {
            _viewEvents.value = this
        } else {
            _viewEvents.postValue(this)
        }
    }

    protected fun toggleLoader(visible: Boolean) {
        mutableModalLoadingState.postValue(visible)
    }

    protected fun launchIO(
        loader: Loader = Loader.HideOnComplete,
        block: suspend () -> Unit,
    ): Job {
        val job = viewModelScope.launch(Dispatchers.IO) {
            when (loader) {
                Loader.HideOnSuccess -> toggleLoader(true)
                Loader.Hide -> toggleLoader(false)
                Loader.HideOnComplete -> toggleLoader(true)
            }
            block.invoke()
        }
        return job.apply {
            this.invokeOnCompletion { error ->
                when (loader) {
                    Loader.HideOnSuccess -> toggleLoader(error != null)
                    Loader.Hide -> toggleLoader(false)
                    Loader.HideOnComplete -> toggleLoader(false)
                }
            }
        }
    }
}

inline fun <reified T, LD : LiveData<T>> Fragment.observe(
    liveData: LD,
    crossinline block: (T) -> Unit
) {
    liveData.observe(viewLifecycleOwner) { block(it) }
}

class NotNullMutableLiveData<T : Any>(value: T) : MutableLiveData<T>(value) {

    constructor(initialValue: () -> T) : this(initialValue.invoke())

    override fun getValue(): T = super.getValue()!!

}

@Throws(NullPointerException::class)
fun <T : Any> MutableLiveData<T>.delegate(
    transformer: ((T) -> T)? = null
): ReadWriteProperty<Any, T> = object : ReadWriteProperty<Any, T> {
    override fun setValue(thisRef: Any, property: KProperty<*>, value: T) {
        val newValue = transformer?.invoke(value) ?: value
        this@delegate.postValue(newValue)
    }

    override fun getValue(thisRef: Any, property: KProperty<*>): T = value ?: error("стейт = null")
}

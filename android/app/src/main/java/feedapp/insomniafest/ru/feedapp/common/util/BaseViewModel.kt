package feedapp.insomniafest.ru.feedapp.common.util

import androidx.fragment.app.Fragment
import androidx.lifecycle.LiveData
import androidx.lifecycle.ViewModel

abstract class BaseViewModel<E : Any> : ViewModel() {

    private val _viewEvents = SingleLiveEvent<E>()
    val viewEvents: LiveData<E> = _viewEvents

    protected fun E.post(immediately: Boolean = false) {
        if (immediately) {
            _viewEvents.value = this
        } else {
            _viewEvents.postValue(this)
        }
    }
}

inline fun <reified T, LD : LiveData<T>> Fragment.observe(liveData: LD, crossinline block: (T) -> Unit) {
    liveData.observe(viewLifecycleOwner) { block(it) }
}

package feedapp.insomniafest.ru.feedapp.common.util

import androidx.fragment.app.Fragment
import feedapp.insomniafest.ru.feedapp.presentation.common.LoadingDialogPlugin

abstract class BaseFragment : Fragment() {

    private val loadingDialogPlugin by lazy { LoadingDialogPlugin(this) }

    override fun onDestroyView() {
        loadingDialogPlugin.onDestroyView()
        super.onDestroyView()
    }

    protected fun <E : Any> observeBase(viewModel: BaseViewModel<E>) {
        observe(viewModel.modalLoadingState, ::toggleShowLoading)
    }

    fun toggleShowLoading(show: Boolean) = loadingDialogPlugin.toggle(show)
}

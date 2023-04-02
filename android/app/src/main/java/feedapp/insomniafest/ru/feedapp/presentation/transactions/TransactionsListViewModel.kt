package feedapp.insomniafest.ru.feedapp.presentation.transactions

import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import feedapp.insomniafest.ru.feedapp.common.util.BaseViewModel
import feedapp.insomniafest.ru.feedapp.common.util.delegate
import feedapp.insomniafest.ru.feedapp.domain.interactor.SendTransactionsInteractor
import feedapp.insomniafest.ru.feedapp.domain.model.Transaction
import feedapp.insomniafest.ru.feedapp.domain.repository.TransactionRepository
import javax.inject.Inject
import javax.inject.Provider

class TransactionsListViewModel @Inject constructor(
    private val transactionRepository: TransactionRepository,
    private val sendTransactionsInteractor: SendTransactionsInteractor,
) : BaseViewModel<TransactionsListEvent>() {

    private val _viewState = MutableLiveData(TransactionsState(emptyList()))

    private var state by _viewState.delegate()

    init {
        loadTransactions()
    }

    fun reloadTransaction() {
        loadTransactions()
    }

    fun onResendTransactions() {
        sendTransactions()
    }

    private fun loadTransactions() {
        launchIO {
            runCatching {
                transactionRepository.getAllTransactions()
            }.onSuccess { transactions ->
                val countNotSynchronized = transactions.count { !it.isSynchronized }

                state = TransactionsState(transactions = transactions)
                TransactionsListEvent.UpdateTransactions(transactions, countNotSynchronized).post()
            }.onFailure {
                TransactionsListEvent.Error(it.message.orEmpty()).post()
            }
        }
    }

    private fun sendTransactions() {
        launchIO {
            runCatching {
                sendTransactionsInteractor.invoke()
            }.onSuccess { isAllSuccessSent ->
                loadTransactions()

                if (!isAllSuccessSent) TransactionsListEvent.ErrorSend.post()
            }.onFailure {
                TransactionsListEvent.Error(it.message.orEmpty()).post()
            }
        }
    }
}

sealed class TransactionsListEvent {
    class Error(val error: String) : TransactionsListEvent()
    object ErrorSend : TransactionsListEvent()
    class UpdateTransactions(val transactions: List<Transaction>, val countNotSynchronized: Int) :
        TransactionsListEvent()
}

data class TransactionsState(
    val transactions: List<Transaction>,
)

class TransactionsViewModelFactory @Inject constructor(
    transactionsListViewModel: Provider<TransactionsListViewModel>
) : ViewModelProvider.Factory {
    private val providers = mapOf<Class<*>, Provider<out ViewModel>>(
        TransactionsListViewModel::class.java to transactionsListViewModel
    )

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return providers[modelClass]!!.get() as T
    }
}

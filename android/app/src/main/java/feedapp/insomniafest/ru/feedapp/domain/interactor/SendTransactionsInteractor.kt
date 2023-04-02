package feedapp.insomniafest.ru.feedapp.domain.interactor

import feedapp.insomniafest.ru.feedapp.domain.repository.TransactionRepository

class SendTransactionsInteractor(
    private val transactionRepository: TransactionRepository,
) {
    suspend fun invoke(): Boolean {
        val transactions = transactionRepository.getAllNotSynchronizedTransactions()

        var isAllSuccessSent = true

        transactions.forEach { transaction ->
            runCatching {
                transactionRepository.sendTransaction(transaction)
            }.onSuccess { isResponseSuccessful ->
                if (isResponseSuccessful) {
                    transactionRepository.updateSynchronize(transaction.copy(isSynchronized = true))
                }
                isAllSuccessSent = isAllSuccessSent && isResponseSuccessful
            }
        }

        return isAllSuccessSent
    }
}

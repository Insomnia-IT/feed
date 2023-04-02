package feedapp.insomniafest.ru.feedapp.data.transactions.repository

import feedapp.insomniafest.ru.feedapp.domain.model.Transaction

interface TransactionRemoteDataSource {
    suspend fun sendTransaction(transaction: Transaction): Boolean
}

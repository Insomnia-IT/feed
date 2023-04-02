package feedapp.insomniafest.ru.feedapp.data.transactions.repository

import feedapp.insomniafest.ru.feedapp.domain.model.Transaction
import feedapp.insomniafest.ru.feedapp.domain.model.VolunteerId

interface TransactionLocalDataSource {
    suspend fun createTransaction(volunteerId: VolunteerId)

    suspend fun getTransactionTimestampByVolId(volunteerId: VolunteerId): List<Long>

    suspend fun addLastTransaction(): VolunteerId
    suspend fun addLastTransactionAnyway(): VolunteerId

    suspend fun getAllTransactions(): List<Transaction>
    suspend fun getAllNotSynchronizedTransactions(): List<Transaction>

    suspend fun updateSynchronize(transaction: Transaction)
}

package feedapp.insomniafest.ru.feedapp.domain.repository

import feedapp.insomniafest.ru.feedapp.domain.model.Transaction
import feedapp.insomniafest.ru.feedapp.domain.model.VolunteerId

interface TransactionRepository {
    suspend fun createTransaction(volunteerId: VolunteerId)

    suspend fun getTransactionTimestampByVolId(volunteerId: VolunteerId): List<Long>

    suspend fun addLastTransaction(isSaveAnyway: Boolean = false): VolunteerId

    suspend fun getAllTransactions(): List<Transaction>
    suspend fun getAllNotSynchronizedTransactions(): List<Transaction>

    suspend fun updateSynchronize(transaction: Transaction)

    suspend fun sendTransaction(transaction: Transaction): Boolean
}

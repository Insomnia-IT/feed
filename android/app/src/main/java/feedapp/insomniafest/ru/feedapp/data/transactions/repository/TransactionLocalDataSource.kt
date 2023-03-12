package feedapp.insomniafest.ru.feedapp.data.transactions.repository

import feedapp.insomniafest.ru.feedapp.domain.model.VolunteerId

interface TransactionLocalDataSource {
    suspend fun createTransaction(volunteerId: VolunteerId)

    suspend fun getTransactionsByVolId(volunteerId: VolunteerId): List<Long>

    suspend fun addLastTransaction(): VolunteerId
}

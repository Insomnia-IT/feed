package feedapp.insomniafest.ru.feedapp.domain.repository

import feedapp.insomniafest.ru.feedapp.domain.model.VolunteerId

interface TransactionRepository {
    suspend fun createTransaction(volunteerId: VolunteerId)

    suspend fun getTransactionsByVolId(volunteerId: VolunteerId): List<Long>

    suspend fun addLastTransaction(): VolunteerId
}

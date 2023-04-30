package feedapp.insomniafest.ru.feedapp.data.transactions.repository

import feedapp.insomniafest.ru.feedapp.domain.model.*

interface TransactionLocalDataSource {
    suspend fun getTransactionTimestampByVolId(volunteerId: VolunteerId): List<Long>

    suspend fun saveTransaction(volunteer: Volunteer, eatingType: EatingType)

    suspend fun getSeveralTransactions(count: Int): List<Transaction>

    suspend fun getTransactionsForPeriodByFeedType(
        from: Long,
        to: Long,
        feedType: FeedType
    ): List<Transaction>

    suspend fun getAllNotSynchronizedTransactions(): List<Transaction>

    suspend fun updateSynchronize(transaction: Transaction)
}

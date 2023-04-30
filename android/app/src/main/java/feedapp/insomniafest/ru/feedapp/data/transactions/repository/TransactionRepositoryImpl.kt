package feedapp.insomniafest.ru.feedapp.data.transactions.repository

import feedapp.insomniafest.ru.feedapp.domain.model.*
import feedapp.insomniafest.ru.feedapp.domain.repository.TransactionRepository

internal class TransactionRepositoryImpl(
    private val transactionLocalDataSource: TransactionLocalDataSource,
    private val transactionRemoteDataSource: TransactionRemoteDataSource,
) : TransactionRepository {

    override suspend fun getTransactionTimestampByVolId(volunteerId: VolunteerId): List<Long> {
        return transactionLocalDataSource.getTransactionTimestampByVolId(volunteerId)
    }

    override suspend fun saveTransaction(
        volunteer: Volunteer,
        eatingType: EatingType,
    ) {
        transactionLocalDataSource.saveTransaction(volunteer, eatingType)
    }

    override suspend fun getSeveralTransactions(count: Int): List<Transaction> {
        return transactionLocalDataSource.getSeveralTransactions(count)
    }

    override suspend fun getTransactionsForPeriodByFeedType(
        from: Long,
        to: Long,
        feedType: FeedType
    ): List<Transaction> {
        return transactionLocalDataSource.getTransactionsForPeriodByFeedType(from, to, feedType)
    }

    override suspend fun getAllNotSynchronizedTransactions(): List<Transaction> {
        return transactionLocalDataSource.getAllNotSynchronizedTransactions()
    }

    override suspend fun updateSynchronize(transaction: Transaction) {
        return transactionLocalDataSource.updateSynchronize(transaction)
    }

    override suspend fun sendTransaction(transaction: Transaction): Boolean {
        return transactionRemoteDataSource.sendTransaction(transaction)
    }
}

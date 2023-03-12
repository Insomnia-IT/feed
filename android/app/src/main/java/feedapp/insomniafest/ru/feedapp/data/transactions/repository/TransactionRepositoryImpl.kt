package feedapp.insomniafest.ru.feedapp.data.transactions.repository

import feedapp.insomniafest.ru.feedapp.domain.model.VolunteerId
import feedapp.insomniafest.ru.feedapp.domain.repository.TransactionRepository

internal class TransactionRepositoryImpl(
    private val transactionLocalDataSource: TransactionLocalDataSource,
    private val transactionRemoteDataSource: TransactionRemoteDataSource,
) : TransactionRepository {
    override suspend fun createTransaction(volunteerId: VolunteerId) {
        transactionLocalDataSource.createTransaction(volunteerId)
    }

    override suspend fun getTransactionsByVolId(volunteerId: VolunteerId): List<Long> {
        return transactionLocalDataSource.getTransactionsByVolId(volunteerId)
    }

    override suspend fun addLastTransaction(): VolunteerId {
        return transactionLocalDataSource.addLastTransaction()
    }
}

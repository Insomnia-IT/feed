package feedapp.insomniafest.ru.feedapp.data.transactions.repository

import feedapp.insomniafest.ru.feedapp.domain.model.Transaction
import feedapp.insomniafest.ru.feedapp.domain.model.VolunteerId
import feedapp.insomniafest.ru.feedapp.domain.repository.TransactionRepository

internal class TransactionRepositoryImpl(
    private val transactionLocalDataSource: TransactionLocalDataSource,
    private val transactionRemoteDataSource: TransactionRemoteDataSource,
) : TransactionRepository {
    override suspend fun createTransaction(volunteerId: VolunteerId) {
        transactionLocalDataSource.createTransaction(volunteerId)
    }

    override suspend fun getTransactionTimestampByVolId(volunteerId: VolunteerId): List<Long> {
        return transactionLocalDataSource.getTransactionTimestampByVolId(volunteerId)
    }

    override suspend fun addLastTransaction(isSaveAnyway: Boolean): VolunteerId {
        val volId = try {
            transactionLocalDataSource.addLastTransaction()
        } catch (e: Throwable) {
            if (isSaveAnyway) {
                transactionLocalDataSource.addLastTransactionAnyway()
            } else {
                throw e
            }
        }
        return volId
    }

    override suspend fun getAllTransactions(): List<Transaction> {
        return transactionLocalDataSource.getAllTransactions()
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

package feedapp.insomniafest.ru.feedapp.data.transactions.room

import com.github.guepardoapps.kulid.ULID
import feedapp.insomniafest.ru.feedapp.common.util.getCurTime
import feedapp.insomniafest.ru.feedapp.data.transactions.dao.TransactionDao
import feedapp.insomniafest.ru.feedapp.data.transactions.dao.TransactionEntity
import feedapp.insomniafest.ru.feedapp.data.transactions.repository.TransactionLocalDataSource
import feedapp.insomniafest.ru.feedapp.domain.model.*

internal class RoomTransactionDataSource(
    private val transactionDao: TransactionDao,
) : TransactionLocalDataSource {

    private val entropy = byteArrayOf(0x0, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8, 0x9)

    override suspend fun getTransactionTimestampByVolId(volunteerId: VolunteerId): List<Long> {
        return transactionDao.getTransactionsByVolId(volunteerId.id).map { it.ts }
    }

    override suspend fun saveTransaction(volunteer: Volunteer, eatingType: EatingType) {
        val curTime = getCurTime()
        transactionDao.addTransaction(
            TransactionEntity(
                volId = volunteer.id.id,
                volName = volunteer.volName,
                ts = curTime,
                ulid = ULID.generate(curTime, entropy),
                eatingType = eatingType.value,
                feedType = volunteer.feedType.value,
                isSynchronized = false,
            )
        )
    }

    override suspend fun getSeveralTransactions(count: Int): List<Transaction> {
        return transactionDao.getSeveralTransactions(count).map { it.toTransaction() }
    }

    override suspend fun getTransactionsForPeriodByFeedType(
        from: Long,
        to: Long,
        feedType: FeedType,
    ): List<Transaction> {
        return when (feedType) {
            FeedType.UNKNOWN -> {
                transactionDao.getAllTransactionsForPeriod(from, to).map { it.toTransaction() }
            }
            else -> {
                transactionDao.getTransactionsForPeriodByFeedType(from, to, feedType.value)
                    .map { it.toTransaction() }
            }
        }
    }

    override suspend fun getAllNotSynchronizedTransactions(): List<Transaction> {
        return transactionDao.getAllNotSynchronizedTransactions().map { it.toTransaction() }
    }

    override suspend fun updateSynchronize(transaction: Transaction) {
        transactionDao.updateSynchronize(transaction.toTransactionEntity())
    }


    private fun TransactionEntity.toTransaction(): Transaction {
        return Transaction(
            id = id!!,
            volId = volId,
            volName = volName,
            ts = ts,
            ulid = ulid,
            eatingType = EatingType.fromValue(eatingType),
            feedType = FeedType.fromValue(feedType),
            isSynchronized = isSynchronized,
        )
    }

    private fun Transaction.toTransactionEntity(): TransactionEntity {
        return TransactionEntity(
            id = id,
            volId = volId,
            volName = volName,
            ts = ts,
            ulid = ulid,
            eatingType = eatingType.value,
            feedType = feedType.value,
            isSynchronized = isSynchronized,
        )
    }
}

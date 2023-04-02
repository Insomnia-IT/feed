package feedapp.insomniafest.ru.feedapp.data.transactions.room

import com.github.guepardoapps.kulid.ULID
import feedapp.insomniafest.ru.feedapp.common.util.getCurTime
import feedapp.insomniafest.ru.feedapp.data.pref.AppPreference
import feedapp.insomniafest.ru.feedapp.data.transactions.dao.TransactionDao
import feedapp.insomniafest.ru.feedapp.data.transactions.dao.TransactionEntity
import feedapp.insomniafest.ru.feedapp.data.transactions.repository.TransactionLocalDataSource
import feedapp.insomniafest.ru.feedapp.domain.model.Transaction
import feedapp.insomniafest.ru.feedapp.domain.model.VolunteerId
import feedapp.insomniafest.ru.feedapp.domain.model.invalidId

internal class RoomTransactionDataSource(
    private val transactionDao: TransactionDao,
    private val appPreference: AppPreference,
) : TransactionLocalDataSource {

    private val entropy = byteArrayOf(0x0, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8, 0x9)

    override suspend fun createTransaction(volunteerId: VolunteerId) {
        appPreference.lastTransaction = volunteerId.id // решение не очень, но пока не пойму почему
    }

    override suspend fun getTransactionTimestampByVolId(volunteerId: VolunteerId): List<Long> {
        return transactionDao.getTransactionsByVolId(volunteerId.id).map { it.ts }
    }

    override suspend fun addLastTransaction(): VolunteerId {
        val volId = VolunteerId(appPreference.lastTransaction)
            .also { if (!it.isValid) throw Throwable("Транзакция не была найдена (appPreference.lastTransaction is Empty)") }
        val curTime = getCurTime()
        transactionDao.addTransaction(
            TransactionEntity(
                vol_id = volId.id,
                ts = curTime,
                ulid = ULID.generate(curTime, entropy),
                isSynchronized = false,
            )
        ).also { appPreference.lastTransaction = invalidId }
        return volId
    }

    override suspend fun addLastTransactionAnyway(): VolunteerId {
        val volId = VolunteerId(appPreference.lastTransaction)
        val curTime = getCurTime()
        transactionDao.addTransaction(
            TransactionEntity(
                vol_id = volId.id,
                ts = curTime,
                ulid = ULID.generate(curTime, entropy),
                isSynchronized = false,
            )
        ).also { appPreference.lastTransaction = invalidId }
        return volId
    }

    override suspend fun getAllTransactions(): List<Transaction> {
        return transactionDao.getAllTransactions().map { it.toTransaction() }
    }

    override suspend fun getAllNotSynchronizedTransactions(): List<Transaction> {
        return transactionDao.getAllNotSynchronizedTransactions().map { it.toTransaction() }
    }

    override suspend fun updateSynchronize(transaction: Transaction) {
        transactionDao.updateSynchronize(transaction.toTransactionEntity())
    }
}

private fun TransactionEntity.toTransaction(): Transaction {
    return Transaction(
        id = id!!,
        vol_id = vol_id,
        ts = ts,
        ulid = ulid,
        isSynchronized = isSynchronized,
    )
}

private fun Transaction.toTransactionEntity(): TransactionEntity {
    return TransactionEntity(
        id = id,
        vol_id = vol_id,
        ts = ts,
        ulid = ulid,
        isSynchronized = isSynchronized,
    )
}

package feedapp.insomniafest.ru.feedapp.data.transactions.dao

import androidx.room.*

@Dao
interface TransactionDao {
    @Query("SELECT * FROM ${TransactionEntity.TABLE_NAME} WHERE ${TransactionEntity.VOL_ID_COLUMN} = :volunteerId")
    suspend fun getTransactionsByVolId(volunteerId: Int): List<TransactionEntity>

    @Insert(entity = TransactionEntity::class, onConflict = OnConflictStrategy.ABORT)
    suspend fun addTransaction(transactionEntity: TransactionEntity)

    @Query("SELECT * FROM ${TransactionEntity.TABLE_NAME}")
    suspend fun getAllTransactions(): List<TransactionEntity>

    @Query("SELECT * FROM ${TransactionEntity.TABLE_NAME} WHERE ${TransactionEntity.TIME_STAMP} >= :from AND ${TransactionEntity.TIME_STAMP} <= :to")
    suspend fun getAllTransactionsForPeriod(from: Long, to: Long): List<TransactionEntity>

    @Query("SELECT * FROM ${TransactionEntity.TABLE_NAME} WHERE ${TransactionEntity.TIME_STAMP} >= :from AND ${TransactionEntity.TIME_STAMP} <= :to AND ${TransactionEntity.FEED_TYPE} = :feedType")
    suspend fun getTransactionsForPeriodByFeedType(
        from: Long,
        to: Long,
        feedType: String,
    ): List<TransactionEntity>

    @Query("SELECT * FROM ${TransactionEntity.TABLE_NAME} WHERE ${TransactionEntity.IS_SYNCHRONIZED_COLUMN} = :isSynchronized")
    suspend fun getAllNotSynchronizedTransactions(isSynchronized: Boolean = false): List<TransactionEntity>

//    @Query("UPDATE ${TransactionEntity.TABLE_NAME} SET ${TransactionEntity.IS_SYNCHRONIZED_COLUMN} = :isSynchronize WHERE ${TransactionEntity.TRANSACTION_ID_COLUMN} = :id")
//    suspend fun updateSynchronize(id: Int, isSynchronize: Boolean)

    @Update(entity = TransactionEntity::class)
    suspend fun updateSynchronize(transaction: TransactionEntity)
}

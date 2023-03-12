package feedapp.insomniafest.ru.feedapp.data.transactions.dao

import androidx.room.*

@Dao
interface TransactionDao {
    @Query("SELECT * FROM ${TransactionEntity.TABLE_NAME} WHERE ${TransactionEntity.VOL_ID_COLUMN} = :volunteerId")
    suspend fun getTransactionsByVolId(volunteerId: Int): List<TransactionEntity>

    @Insert(entity = TransactionEntity::class, onConflict = OnConflictStrategy.ABORT)
    suspend fun addTransaction(transactionEntity: TransactionEntity)
}

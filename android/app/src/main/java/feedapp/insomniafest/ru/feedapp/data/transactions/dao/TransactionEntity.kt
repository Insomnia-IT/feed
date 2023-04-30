package feedapp.insomniafest.ru.feedapp.data.transactions.dao

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = TransactionEntity.TABLE_NAME)
data class TransactionEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = TRANSACTION_ID_COLUMN)
    val id: Int? = null,

    @ColumnInfo(name = VOL_ID_COLUMN)
    val volId: Int,

    @ColumnInfo(name = "vol_name")
    val volName: String,

    @ColumnInfo(name = TIME_STAMP)
    val ts: Long,

    @ColumnInfo(name = "ulid")
    val ulid: String,

    @ColumnInfo(name = EATING_TYPE)
    val eatingType: Int,

    @ColumnInfo(name = FEED_TYPE)
    val feedType: String?,

    @ColumnInfo(name = IS_SYNCHRONIZED_COLUMN)
    val isSynchronized: Boolean,
) {
    companion object {
        const val TABLE_NAME = "transaction_entities_table"
        const val TRANSACTION_ID_COLUMN = "id"
        const val VOL_ID_COLUMN = "vol_id"
        const val TIME_STAMP = "ts"
        const val EATING_TYPE = "eating_type"
        const val FEED_TYPE = "feed_type"
        const val IS_SYNCHRONIZED_COLUMN = "is_synchronized"
    }
}

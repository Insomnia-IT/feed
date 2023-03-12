package feedapp.insomniafest.ru.feedapp.data.transactions.dao

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = TransactionEntity.TABLE_NAME)
data class TransactionEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "id")
    val id: Int? = null,

    @ColumnInfo(name = VOL_ID_COLUMN)
    val vol_id: Int,

    @ColumnInfo(name = "ts")
    val ts: Long,

    @ColumnInfo(name = "ulid")
    val ulid: String,
) {
    companion object {
        const val TABLE_NAME = "transaction_entities_table"
        const val VOL_ID_COLUMN = "vol_id"
    }
}

package feedapp.insomniafest.ru.feedapp.data.volunteers.dao

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = VolunteerEntity.TABLE_NAME)
data class VolunteerEntity(
    @PrimaryKey
    @ColumnInfo(name = ID_COLUMN)
    val id: Int,

    @ColumnInfo(name = LOGIN_ID_COLUMN)
    val login_id: String,

    @ColumnInfo(name = "name")
    val name: String? = null,

    @ColumnInfo(name = "nickname")
    val nickname: String? = null,

    @ColumnInfo(name = "qr")
    val qr: String,

    @ColumnInfo(name = "is_active")
    val isActive: Boolean,

    @ColumnInfo(name = "is_blocked")
    val isBlocked: Boolean,

    @ColumnInfo(name = "paid")
    val paid: Boolean,

    @ColumnInfo(name = "feed_type")
    val feedType: String? = null,

    @ColumnInfo(name = "active_from")
    val activeFrom: String? = null, // Long

    @ColumnInfo(name = "active_to")
    val activeTo: String? = null, // Long

    @ColumnInfo(name = "department")
    val department: String,

    @ColumnInfo(name = "location")
    val location: String,

    @ColumnInfo(name = "expired")
    val expired: Int,

    @ColumnInfo(name = "balance")
    val balance: Int? = null,
) {
    companion object {
        const val TABLE_NAME = "volunteers_list_entities_table"
        const val ID_COLUMN = "id"
        const val LOGIN_ID_COLUMN = "login_id"
    }
}


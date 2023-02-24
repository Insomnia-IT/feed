package feedapp.insomniafest.ru.feedapp.data.volunteers.dao

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = LoginEntity.TABLE_NAME)
data class LoginEntity(
    @PrimaryKey
    @ColumnInfo(name = LOGIN_COLUMN)
    val login: String,

) {
    companion object {
        const val TABLE_NAME = "login_entities_table"
        const val LOGIN_COLUMN = "login"
    }
}

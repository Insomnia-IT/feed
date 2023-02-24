package feedapp.insomniafest.ru.feedapp.data.volunteers.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface LoginDao {

    @Query("SELECT * FROM ${LoginEntity.TABLE_NAME}")
    suspend fun getAllLogin(): List<LoginEntity>

    @Insert(entity = LoginEntity::class, onConflict = OnConflictStrategy.IGNORE)
    suspend fun addLogin(loginEntity: LoginEntity)

    @Query("SELECT * FROM ${LoginEntity.TABLE_NAME} WHERE ${LoginEntity.LOGIN_COLUMN} = :login")
    suspend fun getLogin(login: String): LoginEntity
}

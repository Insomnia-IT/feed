package feedapp.insomniafest.ru.feedapp.data.volunteers.dao

import androidx.room.*

@Dao
interface VolunteersListDao {
    @Transaction
    @Query("SELECT * FROM ${LoginEntity.TABLE_NAME} WHERE ${LoginEntity.LOGIN_COLUMN} = :login")
    suspend fun getVolunteersByLogin(login: String): List<LoginWithVolunteersEntity> // Возвращает список волонтеров у которых fereignKey равен текущему логину

    @Transaction
    @Query("SELECT * FROM ${LoginEntity.TABLE_NAME}")
    suspend fun getAllVolunteers(): List<LoginWithVolunteersEntity> // Возвращает список волонтеров у которых fereignKey равен текущему логину

    @Insert(entity = VolunteerEntity::class, onConflict = OnConflictStrategy.REPLACE)
    suspend fun addVolunteer(volunteerEntity: VolunteerEntity)

    @Insert(entity = VolunteerEntity::class, onConflict = OnConflictStrategy.REPLACE)
    @JvmSuppressWildcards
    suspend fun saveAllVolunteersByLogin(entities: List<VolunteerEntity>)

    @Query("DELETE FROM ${VolunteerEntity.TABLE_NAME}")
    fun deleteAllVolunteers()
}

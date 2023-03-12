package feedapp.insomniafest.ru.feedapp.data.volunteers.dao

import androidx.room.*

@Dao
interface VolunteersListDao {
    @Transaction
    @Query("SELECT * FROM ${LoginEntity.TABLE_NAME} WHERE ${LoginEntity.LOGIN_COLUMN} = :login")
    suspend fun getVolunteersByLogin(login: String): List<LoginWithVolunteersEntity> // Возвращает список волонтеров у которых fereignKey равен текущему логину

    @Transaction
    @Query("SELECT * FROM ${LoginEntity.TABLE_NAME}")
    suspend fun getAllVolunteers(): List<LoginWithVolunteersEntity> // для дебага

    @Insert(entity = VolunteerEntity::class, onConflict = OnConflictStrategy.REPLACE)
    suspend fun addVolunteer(volunteerEntity: VolunteerEntity)

    @Insert(entity = VolunteerEntity::class, onConflict = OnConflictStrategy.REPLACE)
    @JvmSuppressWildcards
    suspend fun saveAllVolunteersByLogin(entities: List<VolunteerEntity>)

    @Query("DELETE FROM ${VolunteerEntity.TABLE_NAME}")
    suspend fun deleteAllVolunteers()

    @Query("SELECT * FROM ${VolunteerEntity.TABLE_NAME} WHERE ${VolunteerEntity.ID_COLUMN} = :volunteerId")
    suspend fun getVolunteerById(volunteerId: Int): VolunteerEntity

    @Update(entity = VolunteerEntity::class, onConflict = OnConflictStrategy.REPLACE)
    suspend fun updateVolunteer(volunteerEntity: VolunteerEntity)
}

package feedapp.insomniafest.ru.feedapp.data.volunteers.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface VolunteersListDao {

    @Query("SELECT * FROM ${VolunteerEntity.TABLE_NAME}")
    suspend fun loadAllVolunteers(): List<VolunteerEntity>

    @Insert(entity = VolunteerEntity::class, onConflict = OnConflictStrategy.REPLACE)
    suspend fun addVolunteer(volunteerEntity: VolunteerEntity)

    @Insert(entity = VolunteerEntity::class, onConflict = OnConflictStrategy.REPLACE)
    @JvmSuppressWildcards
    suspend fun saveAllVolunteers(entitys: List<VolunteerEntity>)
}

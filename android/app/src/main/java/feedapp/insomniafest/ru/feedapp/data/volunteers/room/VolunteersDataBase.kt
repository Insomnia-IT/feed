package feedapp.insomniafest.ru.feedapp.data.volunteers.room

import androidx.room.Database
import androidx.room.RoomDatabase
import feedapp.insomniafest.ru.feedapp.data.volunteers.dao.VolunteerEntity
import feedapp.insomniafest.ru.feedapp.data.volunteers.dao.VolunteersListDao

@Database(
    entities = [
        VolunteerEntity::class,
    ], version = 2, exportSchema = true
)
abstract class VolunteersDataBase: RoomDatabase() {
    abstract fun questVolunteersDao(): VolunteersListDao
}

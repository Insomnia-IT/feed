package feedapp.insomniafest.ru.feedapp.data.volunteers.room

import androidx.room.Database
import androidx.room.RoomDatabase
import feedapp.insomniafest.ru.feedapp.data.volunteers.dao.LoginDao
import feedapp.insomniafest.ru.feedapp.data.volunteers.dao.LoginEntity
import feedapp.insomniafest.ru.feedapp.data.volunteers.dao.VolunteerEntity
import feedapp.insomniafest.ru.feedapp.data.volunteers.dao.VolunteersListDao

@Database(
    entities = [
        VolunteerEntity::class,
        LoginEntity::class,
    ], version = 7, exportSchema = true
)
abstract class VolunteersDataBase : RoomDatabase() {
    abstract fun questVolunteersDao(): VolunteersListDao

    abstract fun questLoginDao(): LoginDao
}

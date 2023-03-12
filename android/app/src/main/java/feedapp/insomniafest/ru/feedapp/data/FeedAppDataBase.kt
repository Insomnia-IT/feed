package feedapp.insomniafest.ru.feedapp.data

import androidx.room.Database
import androidx.room.RoomDatabase
import feedapp.insomniafest.ru.feedapp.data.transactions.dao.TransactionDao
import feedapp.insomniafest.ru.feedapp.data.transactions.dao.TransactionEntity
import feedapp.insomniafest.ru.feedapp.data.volunteers.dao.*

@Database(
    entities = [
        VolunteerEntity::class,
        LoginEntity::class,
        TransactionEntity::class,
    ], version = 11, exportSchema = true
)
abstract class FeedAppDataBase : RoomDatabase() {
    abstract fun questVolunteersDao(): VolunteersListDao

    abstract fun questLoginDao(): LoginDao

    abstract fun questTransactionDao(): TransactionDao
}

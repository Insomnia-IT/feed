package feedapp.insomniafest.ru.feedapp.di.modules

import android.content.Context
import androidx.room.Room
import com.google.gson.Gson
import dagger.Module
import dagger.Provides
import feedapp.insomniafest.ru.feedapp.data.FeedAppDataBase
import feedapp.insomniafest.ru.feedapp.data.pref.AppPreference
import feedapp.insomniafest.ru.feedapp.data.transactions.repository.TransactionLocalDataSource
import feedapp.insomniafest.ru.feedapp.data.transactions.room.RoomTransactionDataSource
import feedapp.insomniafest.ru.feedapp.data.volunteers.repository.VolunteersLocalDataSource
import feedapp.insomniafest.ru.feedapp.data.volunteers.room.RoomVolunteersDataSource
import javax.inject.Singleton

@Module
class LocalDataModule {

    @Provides
    @Singleton
    internal fun providesDataBase(context: Context): FeedAppDataBase {
        return Room.databaseBuilder(context, FeedAppDataBase::class.java, "volunteer_data_base")
            .fallbackToDestructiveMigration()
            .build()
    }

    @Provides
    @Singleton
    internal fun providesVolunteersLocalDataSource(
        gson: Gson,
        feedAppDataBase: FeedAppDataBase,
        appPreference: AppPreference,
    ): VolunteersLocalDataSource {
        return RoomVolunteersDataSource(
            gson,
            feedAppDataBase.questVolunteersDao(),
            feedAppDataBase.questLoginDao(),
            appPreference,
        )
    }

    @Provides
    @Singleton
    internal fun providesTransactionsLocalDataSource(
        feedAppDataBase: FeedAppDataBase,
        appPreference: AppPreference,
    ): TransactionLocalDataSource {
        return RoomTransactionDataSource(
            feedAppDataBase.questTransactionDao(),
            appPreference,
        )
    }
}

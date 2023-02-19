package feedapp.insomniafest.ru.feedapp.di.modules

import android.content.Context
import androidx.room.Room
import com.google.gson.Gson
import dagger.Module
import dagger.Provides
import feedapp.insomniafest.ru.feedapp.data.volunteers.repository.VolunteersLocalDataSource
import feedapp.insomniafest.ru.feedapp.data.volunteers.room.RoomVolunteersDataSource
import feedapp.insomniafest.ru.feedapp.data.volunteers.room.VolunteersDataBase
import javax.inject.Singleton

@Module
class LocalDataModule {

    @Provides
    @Singleton
    internal fun providesDataBase(context: Context): VolunteersDataBase {
        return Room.databaseBuilder(
            context,
            VolunteersDataBase::class.java,
            "volunteer_data_base",
        ).build()
    }

    @Provides
    @Singleton
    internal fun providesVolunteersLocalDataSource(gson: Gson, volunteersDataBase: VolunteersDataBase): VolunteersLocalDataSource {
        return RoomVolunteersDataSource(gson, volunteersDataBase.questVolunteersDao())
    }
}

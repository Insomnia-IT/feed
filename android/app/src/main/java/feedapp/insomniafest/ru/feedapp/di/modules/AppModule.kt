package feedapp.insomniafest.ru.feedapp.di.modules

import android.app.Application
import android.content.Context
import dagger.Module
import dagger.Provides
import feedapp.insomniafest.ru.feedapp.data.pref.AppPreference
import feedapp.insomniafest.ru.feedapp.data.pref.AppPreferenceImpl
import javax.inject.Singleton

@Module
class AppModule(private val application: Application) {

    @Provides
    @Singleton
    fun providesApplication(): Application = application

    @Provides
    @Singleton
    fun providesApplicationContext(): Context = application

    @Provides
    @Singleton
    fun providesSharedPreferences(context: Context): AppPreference = AppPreferenceImpl(context)
}

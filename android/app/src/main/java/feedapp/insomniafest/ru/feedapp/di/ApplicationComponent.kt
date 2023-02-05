package feedapp.insomniafest.ru.feedapp.di

import android.app.Application
import android.content.Context
import dagger.BindsInstance
import dagger.Component
import feedapp.insomniafest.ru.feedapp.di.api.NetworkModule
import javax.inject.Singleton

@Singleton
@Component(
    modules = [
        NetworkModule::class,
    ]
)
interface ApplicationComponent {

    @Component.Factory
    interface Factory {
        fun create(
            @BindsInstance application: Application,
            @BindsInstance applicationContext: Context
        ): ApplicationComponent
    }
}
package feedapp.insomniafest.ru.feedapp.di

import android.app.Application
import android.content.Context
import dagger.BindsInstance
import dagger.Component
import feedapp.insomniafest.ru.feedapp.di.api.NetworkModule
import feedapp.insomniafest.ru.feedapp.di.main.MainComponent
import javax.inject.Singleton

@Singleton
@Component(
    modules = [
        NetworkModule::class,
        SubComponentsModule::class,
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

    fun mainComponent(): MainComponent.Factory
}
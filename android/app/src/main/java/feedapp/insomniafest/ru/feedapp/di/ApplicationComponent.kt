package feedapp.insomniafest.ru.feedapp.di

import dagger.Component
import feedapp.insomniafest.ru.feedapp.di.api.NetworkModule
import feedapp.insomniafest.ru.feedapp.presentation.main.MainActivity
import feedapp.insomniafest.ru.feedapp.presentation.volunteers.ViewModelFactory
import javax.inject.Singleton

@Singleton
@Component(
    modules = [
        NetworkModule::class,
    ]
)
interface ApplicationComponent {
    fun inject(activity: MainActivity)

    fun viewModelsFactory(): ViewModelFactory
}

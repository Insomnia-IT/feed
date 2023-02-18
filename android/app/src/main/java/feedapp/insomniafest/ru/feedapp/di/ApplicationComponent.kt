package feedapp.insomniafest.ru.feedapp.di

import dagger.Component
import feedapp.insomniafest.ru.feedapp.di.api.NetworkModule
import feedapp.insomniafest.ru.feedapp.domain.repository.VolunteersRepository
import feedapp.insomniafest.ru.feedapp.presentation.main.MainActivity
import javax.inject.Singleton

@Singleton
@Component(
    modules = [
        NetworkModule::class,
    ]
)
interface ApplicationComponent {

    fun inject(activity: MainActivity)

    val volunteersRepository: VolunteersRepository
}
package feedapp.insomniafest.ru.feedapp.di

import dagger.Component
import feedapp.insomniafest.ru.feedapp.di.modules.AppModule
import feedapp.insomniafest.ru.feedapp.di.modules.LocalDataModule
import feedapp.insomniafest.ru.feedapp.di.modules.NetworkModule
import feedapp.insomniafest.ru.feedapp.presentation.login.LoginFragment
import feedapp.insomniafest.ru.feedapp.presentation.login.LoginViewModelFactory
import feedapp.insomniafest.ru.feedapp.presentation.main.MainActivity
import feedapp.insomniafest.ru.feedapp.presentation.scanner.ScannerViewModelFactory
import feedapp.insomniafest.ru.feedapp.presentation.volunteers.ViewModelFactory
import javax.inject.Singleton

@Singleton
@Component(
    modules = [
        AppModule::class,
        NetworkModule::class,
        LocalDataModule::class,
    ]
)
interface ApplicationComponent {
    fun inject(activity: MainActivity)
    fun inject(fragment: LoginFragment)

    fun scannerViewModelFactory(): ScannerViewModelFactory
    fun viewModelsFactory(): ViewModelFactory
    fun loginViewModelFactory(): LoginViewModelFactory
}

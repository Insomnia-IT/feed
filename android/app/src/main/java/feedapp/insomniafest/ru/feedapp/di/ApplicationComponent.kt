package feedapp.insomniafest.ru.feedapp.di

import dagger.Component
import feedapp.insomniafest.ru.feedapp.di.modules.AppModule
import feedapp.insomniafest.ru.feedapp.di.modules.LocalDataModule
import feedapp.insomniafest.ru.feedapp.di.modules.ModelModule
import feedapp.insomniafest.ru.feedapp.di.modules.NetworkModule
import feedapp.insomniafest.ru.feedapp.presentation.login.LoginFragment
import feedapp.insomniafest.ru.feedapp.presentation.login.LoginViewModelFactory
import feedapp.insomniafest.ru.feedapp.presentation.main.MainActivity
import feedapp.insomniafest.ru.feedapp.presentation.scanner.ScannerMainViewModelFactory
import feedapp.insomniafest.ru.feedapp.presentation.scanner.ScannerViewModelFactory
import feedapp.insomniafest.ru.feedapp.presentation.statistics.StatisticsViewModelFactory
import feedapp.insomniafest.ru.feedapp.presentation.transactions.TransactionsViewModelFactory
import feedapp.insomniafest.ru.feedapp.presentation.volunteers.ViewModelFactory
import javax.inject.Singleton

@Singleton
@Component(
    modules = [
        AppModule::class,
        ModelModule::class,
        NetworkModule::class,
        LocalDataModule::class,
    ]
)
interface ApplicationComponent {
    fun inject(activity: MainActivity)
    fun inject(fragment: LoginFragment)

    fun scannerMainViewModelFactory(): ScannerMainViewModelFactory
    fun scannerViewModelFactory(): ScannerViewModelFactory
    fun viewModelsFactory(): ViewModelFactory
    fun loginViewModelFactory(): LoginViewModelFactory
    fun transactionsViewModelFactory(): TransactionsViewModelFactory
    fun statisticsViewModelFactory(): StatisticsViewModelFactory
}

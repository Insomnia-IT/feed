package feedapp.insomniafest.ru.feedapp.di.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import dagger.Binds
import dagger.Module
import dagger.multibindings.IntoMap
import feedapp.insomniafest.ru.feedapp.di.main.key.ViewModelKey
import feedapp.insomniafest.ru.feedapp.presentation.main.multifeature.MainViewModelFactory
import feedapp.insomniafest.ru.feedapp.presentation.volunteers.VolunteersListViewModel

@Module
abstract class ViewModelModule{

    @Binds
    abstract fun bindViewModelFactory(factory: MainViewModelFactory): ViewModelProvider.Factory

    @Binds
    @IntoMap
    @ViewModelKey(VolunteersListViewModel::class)
    internal abstract fun bindTabsViewModel(viewModel: VolunteersListViewModel): ViewModel

}
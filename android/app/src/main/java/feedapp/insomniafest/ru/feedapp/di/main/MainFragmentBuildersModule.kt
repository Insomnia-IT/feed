package feedapp.insomniafest.ru.feedapp.di.main

import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentFactory
import dagger.Binds
import dagger.Module
import dagger.multibindings.IntoMap
import feedapp.insomniafest.ru.feedapp.di.main.key.FragmentKey
import feedapp.insomniafest.ru.feedapp.presentation.main.multifeature.MainFragmentFactory
import feedapp.insomniafest.ru.feedapp.presentation.volunteers.VolunteersListFragment

@Module
abstract class MainFragmentBuildersModule {

    @Binds
    abstract fun bindFragmentFactory(mainFragmentFactory: MainFragmentFactory): FragmentFactory

//    @Binds
//    @IntoMap
//    @FragmentKey(ScannerFragment::class)
//    abstract fun bindScannerMainFragment(fragment: ScannerFragment): Fragment

    @Binds
    @IntoMap
    @FragmentKey(VolunteersListFragment::class)
    abstract fun bindVolunteersListFragment(fragment: VolunteersListFragment): Fragment

}
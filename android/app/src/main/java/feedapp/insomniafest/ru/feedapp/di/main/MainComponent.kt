package feedapp.insomniafest.ru.feedapp.di.main

import dagger.Subcomponent
import feedapp.insomniafest.ru.feedapp.presentation.main.multifeature.MainNavHostFragment

@MainFragmentScope
@Subcomponent(
    modules = [
        ViewModelModule::class,
        MainFragmentBuildersModule::class
    ]
)
interface MainComponent {

    @Subcomponent.Factory
    interface Factory {
        fun create(): MainComponent
    }

    fun inject(mainNavHostFragment: MainNavHostFragment)
}
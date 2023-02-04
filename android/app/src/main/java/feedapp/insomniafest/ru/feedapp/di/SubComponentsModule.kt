package feedapp.insomniafest.ru.feedapp.di

import dagger.Module
import feedapp.insomniafest.ru.feedapp.di.main.MainComponent

@Module(
    subcomponents = [
        MainComponent::class,
    ]
)
class SubComponentsModule

package feedapp.insomniafest.ru.feedapp

import android.app.Application
import feedapp.insomniafest.ru.feedapp.di.ApplicationComponent
import feedapp.insomniafest.ru.feedapp.di.DaggerApplicationComponent

class BaseApplication : Application() {

    private var appComponent: ApplicationComponent = DaggerApplicationComponent
        .factory()
        .create(
            application = this,
            applicationContext = this
        )

    fun getAppComponent(): ApplicationComponent {
        return appComponent
    }
}
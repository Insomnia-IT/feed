package feedapp.insomniafest.ru.feedapp

import android.app.Application
import android.content.Context
import feedapp.insomniafest.ru.feedapp.di.ApplicationComponent
import feedapp.insomniafest.ru.feedapp.di.DaggerApplicationComponent
import feedapp.insomniafest.ru.feedapp.di.modules.AppModule

class BaseApplication : Application() {

    lateinit var appComponent: ApplicationComponent

    override fun onCreate() {
        super.onCreate()
        this.appComponent = DaggerApplicationComponent.builder()
            .appModule(AppModule(this))
            .build()
    }
}

val Context.appComponent: ApplicationComponent
    get() = if (this is BaseApplication) {
        appComponent
    } else {
        this.applicationContext.appComponent
    }

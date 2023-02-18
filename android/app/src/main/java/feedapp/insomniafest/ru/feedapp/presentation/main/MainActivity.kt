package feedapp.insomniafest.ru.feedapp.presentation.main

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import feedapp.insomniafest.ru.feedapp.R
import feedapp.insomniafest.ru.feedapp.appComponent

class MainActivity : AppCompatActivity() {

    public override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        appComponent.inject(this)
    }

}

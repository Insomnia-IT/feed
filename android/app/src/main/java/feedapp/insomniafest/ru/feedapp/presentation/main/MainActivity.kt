package feedapp.insomniafest.ru.feedapp.presentation.main

import android.os.Bundle
import androidx.annotation.NavigationRes
import androidx.appcompat.app.AppCompatActivity
import androidx.navigation.NavController
import feedapp.insomniafest.ru.feedapp.R
import feedapp.insomniafest.ru.feedapp.presentation.main.multifeature.MainFragmentFactory
import feedapp.insomniafest.ru.feedapp.presentation.main.multifeature.MainNavController
import feedapp.insomniafest.ru.feedapp.presentation.main.multifeature.MainNavHostFragment

class MainActivity : AppCompatActivity(), MainNavController {

    private var navController: NavController? = null

    public override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        if (savedInstanceState == null) {
            navMain()
        }
    }

    override fun navController() = navController

    override fun navMain() {
        createNavHost(
            R.navigation.nav_graph,
            MainFragmentFactory.FRAGMENT_FACTORY_NAME
        )
    }

    private fun createNavHost(@NavigationRes graphId: Int, fragmentFactoryName: String) {

        val newNavHostFragment = when (fragmentFactoryName) {

            MainFragmentFactory.FRAGMENT_FACTORY_NAME -> {
                MainNavHostFragment.create(
                    graphId
                )
            }

            else -> {
                MainNavHostFragment.create(
                    graphId
                )
            }
        }

        supportFragmentManager.beginTransaction()
            .replace(
                R.id.main_nav_host_container,
                newNavHostFragment,
                getString(R.string.NavHostFragmentTag)
            )
            .setPrimaryNavigationFragment(newNavHostFragment)
            .commit()
    }

    override fun setNavController(navController: NavController) {
        this.navController = navController
    }
}

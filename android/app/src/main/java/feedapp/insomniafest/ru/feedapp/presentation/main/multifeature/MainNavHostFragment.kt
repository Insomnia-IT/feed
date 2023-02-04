package feedapp.insomniafest.ru.feedapp.presentation.main.multifeature

import android.content.Context
import android.os.Bundle
import android.util.Log
import androidx.annotation.NavigationRes
import androidx.navigation.fragment.NavHostFragment
import feedapp.insomniafest.ru.feedapp.BaseApplication
import feedapp.insomniafest.ru.feedapp.di.main.MainFragmentScope
import javax.inject.Inject

@MainFragmentScope
class MainNavHostFragment : NavHostFragment() {

    var mainNavController: MainNavController? = null

    @Inject
    lateinit var mainFragmentFactory: MainFragmentFactory

    override fun onAttach(context: Context) {
        ((activity?.application) as BaseApplication)
            .getAppComponent()
            .mainComponent()
            .create()
            .inject(this)

        childFragmentManager.fragmentFactory = mainFragmentFactory
        try {
            mainNavController = context as MainNavController
        } catch (e: ClassCastException) {
            Log.e("MainNavHostFragment", "$context must implement MainNavController") // TODO
        }
        super.onAttach(context)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        mainNavController?.setNavController(this.navController)
    }

    companion object {

        private const val KEY_GRAPH_ID = "android-support-nav:fragment:graphId"

        @JvmStatic
        fun create(
            @NavigationRes graphId: Int = 0
        ): MainNavHostFragment {
            var bundle: Bundle? = null
            if (graphId != 0) {
                bundle = Bundle()
                bundle.putInt(KEY_GRAPH_ID, graphId)
            }
            val result = MainNavHostFragment()
            if (bundle != null) {
                result.arguments = bundle
            }
            return result
        }
    }
}
package feedapp.insomniafest.ru.feedapp.presentation.scanner

import androidx.fragment.app.Fragment
import androidx.viewpager2.adapter.FragmentStateAdapter

class ScannerFragmentAdapter(fragment: Fragment) : FragmentStateAdapter(fragment) {
    private val countFragment = 3

    override fun getItemCount(): Int = countFragment

    override fun createFragment(position: Int): Fragment = when (position) {
        0 -> KillMeFragment()
        1 -> ScannerFragment()
        2 -> KillMeFragment()
        else -> throw RuntimeException("ScannerFragmentAdapter. Position exceed the count fragment: position ${position + 1}, countFragment $countFragment ")
    }
}
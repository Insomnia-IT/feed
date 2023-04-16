package feedapp.insomniafest.ru.feedapp.presentation.scanner

import androidx.fragment.app.Fragment
import androidx.viewpager2.adapter.FragmentStateAdapter
import feedapp.insomniafest.ru.feedapp.presentation.statistics.StatisticsFragment
import feedapp.insomniafest.ru.feedapp.presentation.transactions.TransactionsListFragment
import feedapp.insomniafest.ru.feedapp.presentation.volunteers.VolunteersListFragment

class ScannerFragmentAdapter(fragment: Fragment) : FragmentStateAdapter(fragment) {
    private val countFragment = 4

    override fun getItemCount(): Int = countFragment

    override fun createFragment(position: Int): Fragment = when (position) {
        0 -> VolunteersListFragment()
        1 -> ScannerFragment()
        2 -> StatisticsFragment()
        3 -> TransactionsListFragment()
        else -> throw RuntimeException("ScannerFragmentAdapter. Position exceed the count fragment: position ${position + 1}, countFragment $countFragment ")
    }
}

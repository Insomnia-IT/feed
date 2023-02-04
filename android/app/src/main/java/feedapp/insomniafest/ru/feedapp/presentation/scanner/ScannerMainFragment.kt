package feedapp.insomniafest.ru.feedapp.presentation.scanner

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import feedapp.insomniafest.ru.feedapp.R
import feedapp.insomniafest.ru.feedapp.databinding.ViewPagerScannerBinding

class ScannerMainFragment : Fragment(R.layout.view_pager_scanner) {

    private lateinit var adapter: ScannerFragmentAdapter

    private var _binding: ViewPagerScannerBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        super.onCreateView(inflater, container, savedInstanceState)
        _binding = ViewPagerScannerBinding.inflate(layoutInflater)

        adapter = ScannerFragmentAdapter(this)
        binding.pager.adapter = adapter
        binding.pager.currentItem = 1

        return binding.root
    }
}
package feedapp.insomniafest.ru.feedapp.presentation.scanner

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import feedapp.insomniafest.ru.feedapp.R
import feedapp.insomniafest.ru.feedapp.appComponent
import feedapp.insomniafest.ru.feedapp.common.util.observe
import feedapp.insomniafest.ru.feedapp.databinding.ViewPagerScannerBinding
import feedapp.insomniafest.ru.feedapp.presentation.scanner.choice_eating_type.ChoiceEatingTypeDialogFragment

class ScannerMainFragment : Fragment(R.layout.view_pager_scanner) {

    private lateinit var adapter: ScannerFragmentAdapter

    private var _binding: ViewPagerScannerBinding? = null
    private val binding get() = _binding!!

    private val viewModel: ScannerMainViewModel by viewModels {
        requireContext().appComponent.scannerMainViewModelFactory()
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        super.onCreateView(inflater, container, savedInstanceState)

        observe(viewModel.viewEvents, ::processEvent)

        _binding = ViewPagerScannerBinding.inflate(layoutInflater)

        adapter = ScannerFragmentAdapter(this)
        binding.pager.adapter = adapter
        binding.pager.currentItem = 1

        return binding.root
    }

    private fun processEvent(event: ScannerMainEvent) = when (event) {
        is ScannerMainEvent.ShowChoicerEatingType -> {
            ChoiceEatingTypeDialogFragment(
                event.type,
                viewModel::onEatingTypeSelected,
            ).show(requireActivity().supportFragmentManager, "ChoiceEatingTypeDialogFragment")
        }
    }
}

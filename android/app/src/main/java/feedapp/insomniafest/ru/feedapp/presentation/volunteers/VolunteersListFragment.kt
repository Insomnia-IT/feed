package feedapp.insomniafest.ru.feedapp.presentation.volunteers

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import feedapp.insomniafest.ru.feedapp.R
import feedapp.insomniafest.ru.feedapp.appComponent
import feedapp.insomniafest.ru.feedapp.common.util.observe
import feedapp.insomniafest.ru.feedapp.databinding.FragmentVolunteersListBinding

class VolunteersListFragment : Fragment(R.layout.fragment_volunteers_list) {
// } : BaseComposeFragment() { к сожалению, compose сильно уступает в скорости работы

    private val viewModel: VolunteersListViewModel by viewModels {
        requireContext().appComponent.viewModelsFactory()
    }

    private lateinit var binding: FragmentVolunteersListBinding
    private lateinit var adapter: VolunteersListAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        super.onCreateView(inflater, container, savedInstanceState)

        binding = FragmentVolunteersListBinding.inflate(layoutInflater)

        val manager = LinearLayoutManager(requireContext())
        adapter = VolunteersListAdapter()

        binding.recyclerView.layoutManager = manager
        binding.recyclerView.adapter = adapter

        // подписываемся на обновление списка волонтеров
        observe(viewModel.viewEvents, ::processEvent)

        return binding.root
    }

    private fun processEvent(event: VolunteersListEvent) = when (event) {
        is VolunteersListEvent.UpdateVolunteers -> adapter.data = event.volunteers
    }

}

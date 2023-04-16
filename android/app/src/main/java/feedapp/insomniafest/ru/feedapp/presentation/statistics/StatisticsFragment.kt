package feedapp.insomniafest.ru.feedapp.presentation.statistics

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.compose.runtime.Composable
import androidx.compose.runtime.livedata.observeAsState
import androidx.fragment.app.viewModels
import feedapp.insomniafest.ru.feedapp.R
import feedapp.insomniafest.ru.feedapp.appComponent
import feedapp.insomniafest.ru.feedapp.common.util.BaseComposeFragment
import feedapp.insomniafest.ru.feedapp.common.util.observe

class StatisticsFragment : BaseComposeFragment() {

    private val viewModel: StatisticsViewModel by viewModels {
        requireContext().appComponent.statisticsViewModelFactory()
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        observeBase(viewModel)
        observe(viewModel.viewEvents, ::processEvent)
    }

    override fun onResume() {
        super.onResume()

        viewModel.onResume()
    }

    @Composable
    override fun FragmentContent() {
        val state = viewModel.viewState.observeAsState().value ?: return

        StatisticsView(
            state = state,
            onDateChange = viewModel::loadStatistics,
            onToggleFeedType = viewModel::onToggleFeedType,
        )
    }

    private fun processEvent(event: StatisticsEvent) = when (event) {
        is StatisticsEvent.Error -> {
            Toast.makeText(
                context,
                getString(R.string.load_error, event.error),
                Toast.LENGTH_LONG
            ).show()
        }
    }
}


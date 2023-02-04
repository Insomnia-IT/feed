package feedapp.insomniafest.ru.feedapp.presentation.volunteers

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.ComposeView
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import feedapp.insomniafest.ru.feedapp.common.util.setThemedContent
import feedapp.insomniafest.ru.feedapp.presentation.main.multifeature.MainViewModelFactory
import javax.inject.Inject

class VolunteersListFragment @Inject constructor(
    private val viewModelFactory: MainViewModelFactory
) : Fragment() {

    private val viewModel: VolunteersListViewModel by viewModels { viewModelFactory }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        return ComposeView(requireContext()).apply {
            setThemedContent { VolunteersList() }
        }
    }

    @Composable
    private fun VolunteersList() {
        val state = viewModel.viewState.observeAsState().value ?: return
        if (state !is VolunteersState.Loaded) return

        Column(modifier = Modifier
            .fillMaxSize()
            .background(Color.Red)) {
            for (volunteer in state.volunteerList) {
                Text(text = volunteer.name)
            }
        }
    }
}
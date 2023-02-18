package feedapp.insomniafest.ru.feedapp.presentation.volunteers

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Modifier
import androidx.fragment.app.viewModels
import feedapp.insomniafest.ru.feedapp.appComponent
import feedapp.insomniafest.ru.feedapp.common.util.BaseComposeFragment

class VolunteersListFragment : BaseComposeFragment() {

    private val viewModel: VolunteersListViewModel by viewModels {
        requireContext().appComponent.viewModelsFactory()
    }

    @Composable
    override fun FragmentContent() {
        val state = viewModel.viewState.observeAsState().value ?: return

        Column(modifier = Modifier.fillMaxSize()) {
            Text(text = "Vol kiss")
            if (state is VolunteersState.Loaded) {
                Column(modifier = Modifier.fillMaxSize()) {
                    for (volunteer in state.volunteerList)
                        Text(text = volunteer.name)
                }
            }
        }
    }


}
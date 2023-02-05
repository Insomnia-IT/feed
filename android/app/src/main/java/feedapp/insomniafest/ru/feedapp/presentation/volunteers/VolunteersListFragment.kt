package feedapp.insomniafest.ru.feedapp.presentation.volunteers

import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.fragment.app.viewModels
import feedapp.insomniafest.ru.feedapp.common.util.BaseComposeFragment
import javax.inject.Inject

class VolunteersListFragment @Inject constructor(
) : BaseComposeFragment() {

    private val viewModel: VolunteersListViewModel by viewModels()

    @Composable
    override fun FragmentContent() {
        Text("Vol list")
    }


}
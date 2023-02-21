package feedapp.insomniafest.ru.feedapp.common.util

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import feedapp.insomniafest.ru.feedapp.databinding.FragmentBaseComposeBinding

abstract class BaseComposeFragment : BaseFragment() {

    private var _binding: FragmentBaseComposeBinding? = null
    private val binding get() = _binding!!

    @Composable
    abstract fun FragmentContent()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        super.onCreateView(inflater, container, savedInstanceState)
        _binding = FragmentBaseComposeBinding.inflate(layoutInflater)

        binding.content.setThemedContent { CreateContentFrame() }
        return binding.root
    }

    @Composable
    protected open fun CreateContentFrame() {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .windowInsetsPadding(WindowInsets.safeDrawing)
                .imePadding()
        ) {
            FragmentContent()
        }
    }
}

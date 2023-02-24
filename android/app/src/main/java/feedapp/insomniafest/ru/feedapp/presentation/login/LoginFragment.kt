package feedapp.insomniafest.ru.feedapp.presentation.login

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.Button
import androidx.compose.material.OutlinedTextField
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.fragment.app.viewModels
import androidx.navigation.findNavController
import feedapp.insomniafest.ru.feedapp.R
import feedapp.insomniafest.ru.feedapp.appComponent
import feedapp.insomniafest.ru.feedapp.common.util.BaseComposeFragment
import feedapp.insomniafest.ru.feedapp.common.util.observe

class LoginFragment : BaseComposeFragment() {

    private val viewModel: LoginViewModel by viewModels {
        requireContext().appComponent.loginViewModelFactory()
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        requireContext().appComponent.inject(this)

        observeBase(viewModel)
        observe(viewModel.viewEvents, ::processEvent)
    }

    @Composable
    override fun FragmentContent() {
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            val login = rememberSaveable { mutableStateOf("") }
            fun onEnterClick() {
                if (login.value.isNotBlank()) {
                    viewModel.tryLogin(login.value)
                }
            }

            OutlinedTextField(
                value = login.value,
                onValueChange = { login.value = it },
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Number,
                ),
                singleLine = true,
                keyboardActions = KeyboardActions(
                    onDone = {
                        onEnterClick()
                    }
                ),
                textStyle = TextStyle(fontSize = 32.sp, textAlign = TextAlign.Center)
            )
            Spacer(modifier = Modifier.height(21.dp))
            Button(
                content = {
                    Text(text = stringResource(R.string.login_button), fontSize = 21.sp)
                },
                onClick = ::onEnterClick,
            )
        }
    }

    private fun processEvent(event: LoginEvent) = when (event) {
        is LoginEvent.Error -> {
            Toast.makeText(
                context,
                getString(R.string.load_error, event.error),
                Toast.LENGTH_LONG
            ).show()
        }
        LoginEvent.Successful -> {
            view?.findNavController()?.navigate(R.id.to_scannerMainFragment)
        }
    }
}


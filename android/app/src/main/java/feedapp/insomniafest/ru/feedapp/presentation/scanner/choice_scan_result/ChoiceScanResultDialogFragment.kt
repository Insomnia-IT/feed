package feedapp.insomniafest.ru.feedapp.presentation.scanner.choice_scan_result

import android.app.Dialog
import android.content.DialogInterface
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Bundle
import android.os.CountDownTimer
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.DialogFragment
import feedapp.insomniafest.ru.feedapp.R
import feedapp.insomniafest.ru.feedapp.databinding.FragmentChoiceResultBinding

enum class ChoiceScanResultStatus {
    SUCCESS,
    ERROR
}

class ChoiceScanResultDialogFragment(
    private val title: String,
    private val message: String? = null,
    private val status: ChoiceScanResultStatus,
    private val textLeftButton: String,
    private val textRightButton: String? = null,
    private val onLeftClickListener: () -> Unit,
    private val onRightClickListener: () -> Unit = {},
) : DialogFragment(R.layout.fragment_choice_result) {

    private var _binding: FragmentChoiceResultBinding? = null
    private val binding get() = _binding!!

    private lateinit var countDownTimer: CountDownTimer

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        val dialog = super.onCreateDialog(savedInstanceState)
        dialog.window?.setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
        return dialog
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        super.onCreateView(inflater, container, savedInstanceState)

        _binding = FragmentChoiceResultBinding.inflate(layoutInflater)

        when (status) {
            ChoiceScanResultStatus.SUCCESS -> binding.container.setBackgroundResource(R.drawable.background_post_scan_success)
            ChoiceScanResultStatus.ERROR -> binding.container.setBackgroundResource(R.drawable.background_post_scan_error)
        }

        binding.title.text = title
        message?.let {
            binding.message.text = message
            binding.message.visibility = View.VISIBLE
        }

        binding.leftButton.setOnClickListener {
            onLeftClickListener.invoke()
            dismiss()
        }
        binding.leftButton.text = textLeftButton

        textRightButton?.let {
            binding.rightButton.setOnClickListener {
                onRightClickListener.invoke()
                dismiss()
            }
            binding.rightButton.text = textRightButton
        }

        countDownTimer = getCountDown()
        countDownTimer.start()

        return binding.root
    }

    override fun onDismiss(dialog: DialogInterface) {
        countDownTimer.cancel()
        onLeftClickListener.invoke() // TODO пу пу пу, нужно по другому обрабатывать клик в не области
        super.onDismiss(dialog)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    private fun getCountDown(): CountDownTimer {
        return object : CountDownTimer(5500, 1000) {
            override fun onTick(millisUntilFinished: Long) {
                binding.leftButton.text =
                    textLeftButton + " (" + (millisUntilFinished / 1000).toString() + ")" // TODO сделать по красоте
            }

            override fun onFinish() {
                onLeftClickListener.invoke()
                dismiss()
            }
        }
    }
}

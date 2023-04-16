package feedapp.insomniafest.ru.feedapp.presentation.scanner.choice_scan_result

import android.annotation.SuppressLint
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
import feedapp.insomniafest.ru.feedapp.common.util.msToString
import feedapp.insomniafest.ru.feedapp.databinding.FragmentChoiceResultBinding
import feedapp.insomniafest.ru.feedapp.domain.model.Volunteer

enum class ChoiceScanResultStatus {
    SUCCESS,
    ERROR,
    BLOCKING_ERROR,
}

class ChoiceScanResultDialogFragment(
    private val volunteer: Volunteer?,
    private val title: String,
    private val message: String? = null,
    private val status: ChoiceScanResultStatus,
    private val textLeftButton: String,
    private val textRightButton: String? = null,
    private val onCanceled: () -> Unit,
    private val onAccepted: ((Volunteer?) -> Unit)? = null,
) : DialogFragment(R.layout.fragment_choice_result) {

    private var _binding: FragmentChoiceResultBinding? = null
    private val binding get() = _binding!!

    private lateinit var countDownTimer: CountDownTimer

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        val dialog = super.onCreateDialog(savedInstanceState)
        dialog.window?.setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
        dialog.setCanceledOnTouchOutside(false) // отключение клика вне области диалогового окна (если нужно обрабатывать см onCancel)
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
            ChoiceScanResultStatus.SUCCESS -> {
                binding.container.setBackgroundResource(R.drawable.background_post_scan_success)
                binding.status.visibility = View.GONE
            }
            ChoiceScanResultStatus.ERROR -> binding.container.setBackgroundResource(R.drawable.background_post_scan_error)
            ChoiceScanResultStatus.BLOCKING_ERROR -> binding.container.setBackgroundResource(R.drawable.background_post_scan_blocking_error)
        }

        binding.title.text = title
        volunteer?.let {
            binding.feedType.text = volunteer.feedType.toString()

            binding.name.text = volunteer.name.orEmpty()

            binding.nickname.text = volunteer.nickname.orEmpty()

            val activeFromTo = when {
                volunteer.activeFrom != null && volunteer.activeTo != null -> {
                    "C ${msToString(volunteer.activeFrom)} по ${msToString(volunteer.activeTo)}"
                }
                volunteer.activeFrom != null -> {
                    "C ${msToString(volunteer.activeFrom)}"
                }
                volunteer.activeTo != null -> {
                    "По ${msToString(volunteer.activeTo)}"
                }
                else -> null
            }
            activeFromTo?.let {
                binding.activeFromTo.text = activeFromTo
            }

            if (volunteer.department.isNotEmpty()) {
                binding.departmentTitle.visibility = View.VISIBLE
                binding.department.text = volunteer.department.map { it.name }.joinToString("\n")
            }

            volunteer.balance?.let {
                binding.balance.text = getString(R.string.scanner_balance, it.toString())
            }
        }
        message?.let {
            binding.message.text = message
        }

        binding.leftButton.setOnClickListener {
            onCanceled.invoke()
            dismiss()
        }
        binding.leftButton.text = textLeftButton

        textRightButton?.let {
            binding.rightButton.setOnClickListener {
                onAccepted?.invoke(volunteer)
                dismiss()
            }
            binding.rightButton.text = textRightButton
            binding.rightButton.visibility = View.VISIBLE
        }

        countDownTimer = getCountDown()
        countDownTimer.start()

        return binding.root
    }

    override fun onDismiss(dialog: DialogInterface) {
        countDownTimer.cancel()
        super.onDismiss(dialog)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    private fun getCountDown(): CountDownTimer {
        return object : CountDownTimer(5500, 1000) {
            @SuppressLint("SetTextI18n")
            override fun onTick(millisUntilFinished: Long) {
                when (status) {
                    ChoiceScanResultStatus.SUCCESS -> {
                        binding.rightButton.text =
                            "$textLeftButton ( ${(millisUntilFinished / 1000)} )"
                    }
                    ChoiceScanResultStatus.ERROR -> {
                        binding.leftButton.text =
                            "$textLeftButton ( ${(millisUntilFinished / 1000)} )"
                    }
                    else -> {}
                }
            }

            override fun onFinish() {
                when (status) {
                    ChoiceScanResultStatus.SUCCESS -> onAccepted?.invoke(volunteer)
                    ChoiceScanResultStatus.ERROR -> onCanceled.invoke()
                    else -> {}
                }
                dismiss()
            }
        }
    }
}

package feedapp.insomniafest.ru.feedapp.presentation.scanner.choice_eating_type

import android.app.Dialog
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.DialogFragment
import feedapp.insomniafest.ru.feedapp.R
import feedapp.insomniafest.ru.feedapp.databinding.FragmentChoiceEatingTypeBinding
import feedapp.insomniafest.ru.feedapp.domain.model.EatingType

class ChoiceEatingTypeDialogFragment(
    private val currentType: EatingType,
    private val onApplyClick: (EatingType) -> Unit,
) : DialogFragment(R.layout.fragment_choice_eating_type) {

    private var _binding: FragmentChoiceEatingTypeBinding? = null
    private val binding get() = _binding!!


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

        _binding = FragmentChoiceEatingTypeBinding.inflate(layoutInflater)

        binding.container.setBackgroundResource(R.drawable.background_post_scan_success)

        when (currentType) {
            EatingType.BREAKFAST -> binding.radioBreakfast.isChecked = true
            EatingType.LUNCH -> binding.radioLunch.isChecked = true
            EatingType.DINNER -> binding.radioDinner.isChecked = true
            EatingType.LATE_DINNER -> binding.radioLateDinner.isChecked = true
        }

        binding.button.setOnClickListener {
            when (binding.radioGroup.checkedRadioButtonId) {
                binding.radioBreakfast.id -> {
                    onApplyClick.invoke(EatingType.BREAKFAST)
                }
                binding.radioLunch.id -> {
                    onApplyClick.invoke(EatingType.LUNCH)
                }
                binding.radioDinner.id -> {
                    onApplyClick.invoke(EatingType.DINNER)
                }
                binding.radioLateDinner.id -> {
                    onApplyClick.invoke(EatingType.LATE_DINNER)
                }
            }
            dismiss()
        }

        return binding.root
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

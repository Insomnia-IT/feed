package feedapp.insomniafest.ru.feedapp.presentation.common

import android.app.Dialog
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.DialogFragment
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentManager
import feedapp.insomniafest.ru.feedapp.R
import pl.droidsonroids.gif.GifImageView
import java.lang.ref.WeakReference

class LoadingDialogPlugin(fm: FragmentManager) {

    constructor(fragment: Fragment) : this(fragment.childFragmentManager)

    private val fmRef = WeakReference(fm)
    private var mLoadingDialog: LoadingDialog? = null

    fun isVisible() = mLoadingDialog != null

    fun toggle(isVisible: Boolean) {
        if (isVisible == isVisible()) {
            return
        }
        if (isVisible) show() else hide()
    }

    private fun show() {
        val manager = fmRef.get() ?: return
        mLoadingDialog?.dismiss()

        mLoadingDialog = LoadingDialog.newInstance().apply {
            show(manager, "loading_Dialog")
        }
    }

    private fun hide() {
        mLoadingDialog?.dismiss()
        mLoadingDialog = null
    }

    fun onDestroyView() {
        toggle(false)
    }
}

class LoadingDialog : DialogFragment() {

    companion object {

        fun newInstance(): LoadingDialog {
            val dialog = LoadingDialog()
            dialog.isCancelable = false
            return dialog
        }

    }

    override fun show(manager: FragmentManager, tag: String?) {
        manager.beginTransaction().add(this, tag).commitAllowingStateLoss()
    }

    override fun dismiss() {
        dismissAllowingStateLoss()
    }

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
        val loadingView = GifImageView(inflater.context)
        loadingView.setImageResource(R.drawable.ic_reloading_2)
        return loadingView
    }
}

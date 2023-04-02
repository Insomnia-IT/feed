package feedapp.insomniafest.ru.feedapp.presentation.transactions

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import feedapp.insomniafest.ru.feedapp.R
import feedapp.insomniafest.ru.feedapp.appComponent
import feedapp.insomniafest.ru.feedapp.common.util.observe
import feedapp.insomniafest.ru.feedapp.databinding.FragmentTransactionsListBinding

class TransactionsListFragment : Fragment(R.layout.fragment_transactions_list) {
// } : BaseComposeFragment() { к сожалению, compose сильно уступает в скорости работы

    private val viewModel: TransactionsListViewModel by viewModels {
        requireContext().appComponent.transactionsViewModelFactory()
    }

    private lateinit var binding: FragmentTransactionsListBinding
    private lateinit var adapter: TransactionsListAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        super.onCreateView(inflater, container, savedInstanceState)

        binding = FragmentTransactionsListBinding.inflate(layoutInflater)

        binding.btnReload.setOnClickListener { onResendTransactions() }

        val manager = LinearLayoutManager(requireContext())
        adapter = TransactionsListAdapter()
        binding.recyclerView.layoutManager = manager
        binding.recyclerView.adapter = adapter
        // подписываемся на обновление списка транзакций
        observe(viewModel.viewEvents, ::processEvent)

        return binding.root
    }

    override fun onResume() {
        super.onResume()
        viewModel.reloadTransaction()
    }

    private fun onResendTransactions() {
        setButtonLoading(true)
        binding.errorMassage.text = ""
        viewModel.onResendTransactions()
    }

    private fun processEvent(event: TransactionsListEvent) {
        if (event is TransactionsListEvent.UpdateTransactions) {
            adapter.data = event.transactions
        }
        showInfoAfterSend(event)
        setButtonLoading(false)
    }

    private fun showInfoAfterSend(event: TransactionsListEvent) = when (event) {
        is TransactionsListEvent.Error -> {
            binding.errorMassage.text = "Произошла ошибка: " + event.error // TODO
            Toast.makeText(context, getString(R.string.load_error, event.error), Toast.LENGTH_LONG)
                .show()
        }
        is TransactionsListEvent.ErrorSend -> {
            Toast.makeText(context, "Некоторые транзакции не удалось синхронизировать", Toast.LENGTH_LONG) // TODO
                .show()
        }
        is TransactionsListEvent.UpdateTransactions -> {
            binding.errorMassage.text = ""
            binding.countTransactions.text =
                "Кол-во кормлений не синхронизированных с сервером: " + event.countNotSynchronized // TODO
        }
    }

    private fun setButtonLoading(isLoading: Boolean) = when (isLoading) {
        true -> {
            binding.btnReload.visibility = View.GONE
            binding.btnReloading.visibility = View.VISIBLE
        }
        false -> {
            binding.btnReload.visibility = View.VISIBLE
            binding.btnReloading.visibility = View.GONE
        }
    }
}

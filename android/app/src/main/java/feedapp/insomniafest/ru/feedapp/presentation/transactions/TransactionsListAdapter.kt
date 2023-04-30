package feedapp.insomniafest.ru.feedapp.presentation.transactions

import android.annotation.SuppressLint
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import feedapp.insomniafest.ru.feedapp.common.util.msToString
import feedapp.insomniafest.ru.feedapp.databinding.ItemTransactionBinding
import feedapp.insomniafest.ru.feedapp.domain.model.FeedType
import feedapp.insomniafest.ru.feedapp.domain.model.Transaction

class TransactionsListAdapter : RecyclerView.Adapter<TransactionsListAdapter.PersonViewHolder>() {

    var data: List<Transaction> = emptyList()
        @SuppressLint("NotifyDataSetChanged")
        set(newValue) {
            field = newValue
            notifyDataSetChanged()
        }

    class PersonViewHolder(val binding: ItemTransactionBinding) :
        RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PersonViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        val binding = ItemTransactionBinding.inflate(inflater, parent, false)

        return PersonViewHolder(binding)
    }

    override fun getItemCount(): Int = data.size

    override fun onBindViewHolder(holder: PersonViewHolder, position: Int) {
        val transaction = data[position]

        holder.binding.name.text = transaction.volName
        holder.binding.date.text = msToString(transaction.ts, "d MMM / HH:mm")
        holder.binding.feedType.text = transaction.feedType.toShortString()
        holder.binding.sync.text = if (transaction.isSynchronized) "Yes" else "No"
    }

    private fun FeedType.toShortString() = when(this) {
        FeedType.UNKNOWN -> "???"
        FeedType.MEAT_EATER -> "Мяс."
        FeedType.VEGETARIAN -> "Вег."
    }
}

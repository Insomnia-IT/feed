package feedapp.insomniafest.ru.feedapp.presentation.volunteers

import android.annotation.SuppressLint
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import feedapp.insomniafest.ru.feedapp.databinding.ItemVolunteerBinding
import feedapp.insomniafest.ru.feedapp.domain.model.Volunteer

class VolunteersListAdapter : RecyclerView.Adapter<VolunteersListAdapter.PersonViewHolder>() {

    var data: List<Volunteer> = emptyList()
        @SuppressLint("NotifyDataSetChanged")
        set(newValue) {
            field = newValue
            notifyDataSetChanged()
        }

    class PersonViewHolder(val binding: ItemVolunteerBinding) :
        RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PersonViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        val binding = ItemVolunteerBinding.inflate(inflater, parent, false)

        return PersonViewHolder(binding)
    }

    override fun getItemCount(): Int = data.size


    override fun onBindViewHolder(holder: PersonViewHolder, position: Int) {
        val person = data[position]

        holder.binding.name.text = person.name
    }
}

package feedapp.insomniafest.ru.feedapp.data.volunteers.dto

import com.google.gson.annotations.SerializedName
import feedapp.insomniafest.ru.feedapp.common.util.Dto
import feedapp.insomniafest.ru.feedapp.common.util.convertList
import feedapp.insomniafest.ru.feedapp.domain.model.VolunteersList

class VolunteersListDto : Dto<VolunteersList> {

    @SerializedName("volunteers")
    private val volunteers: List<VolunteerDto>? = null

    override fun convert(): VolunteersList {
        return VolunteersList(
            volunteersList = volunteers.convertList()
        )
    }
}
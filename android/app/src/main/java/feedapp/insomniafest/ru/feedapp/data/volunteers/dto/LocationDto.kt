package feedapp.insomniafest.ru.feedapp.data.volunteers.dto

import com.google.gson.annotations.SerializedName
import feedapp.insomniafest.ru.feedapp.common.Dto
import feedapp.insomniafest.ru.feedapp.common.getNotNull
import feedapp.insomniafest.ru.feedapp.domain.model.Location

class LocationDto: Dto<Location> {
    @SerializedName("id")
    private val id: Int? = null

    override fun convert(): Location {
        return Location(
            id = getNotNull(id, "Location/id")
        )
    }
}
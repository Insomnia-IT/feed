package feedapp.insomniafest.ru.feedapp.data.volunteers.dto

import com.google.gson.annotations.SerializedName
import feedapp.insomniafest.ru.feedapp.common.util.Dto
import feedapp.insomniafest.ru.feedapp.common.util.getNotNull
import feedapp.insomniafest.ru.feedapp.domain.model.LocationVol

class LocationDto: Dto<LocationVol> {
    @SerializedName("id")
    private val id: Int? = null

    override fun convert(): LocationVol {
        return LocationVol(
            id = getNotNull(id, "Location/id")
        )
    }
}

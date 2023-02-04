package feedapp.insomniafest.ru.feedapp.data.volunteers

import feedapp.insomniafest.ru.feedapp.data.volunteers.dto.VolunteerDto
import retrofit2.http.POST

internal interface VolunteersApi {
    @POST("./vol_list")
    suspend fun getVolunteersList(): List<VolunteerDto>
}
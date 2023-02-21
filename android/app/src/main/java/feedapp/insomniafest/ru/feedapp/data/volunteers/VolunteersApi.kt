package feedapp.insomniafest.ru.feedapp.data.volunteers

import feedapp.insomniafest.ru.feedapp.data.volunteers.dto.VolunteerDto
import retrofit2.http.Header
import retrofit2.http.POST

internal interface VolunteersApi {
    @POST("./vol_list")
    suspend fun getVolunteersList(
        @Header("authorization")auth: String = "Bearer 1649"
    ): retrofit2.Response<List<VolunteerDto>> // TODO
}

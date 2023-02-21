package feedapp.insomniafest.ru.feedapp.data.volunteers

import feedapp.insomniafest.ru.feedapp.data.volunteers.dto.VolunteerDto
import retrofit2.http.Header
import retrofit2.http.POST

internal interface VolunteersApi {
    @POST("./vol_list")
    suspend fun getVolunteersList(
    ): retrofit2.Response<List<VolunteerDto>> // TODO

    @POST("./vol_list") // TODO обсудить другой запрос
    suspend fun checkLogin(
        @Header("authorization")auth: String,
    ): retrofit2.Response<Unit>
}

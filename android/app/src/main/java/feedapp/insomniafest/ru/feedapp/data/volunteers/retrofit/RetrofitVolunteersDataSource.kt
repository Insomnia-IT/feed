package feedapp.insomniafest.ru.feedapp.data.volunteers.retrofit

import feedapp.insomniafest.ru.feedapp.data.volunteers.VolunteersApi
import feedapp.insomniafest.ru.feedapp.data.volunteers.repository.VolunteersRemoteDataSource
import feedapp.insomniafest.ru.feedapp.domain.model.Volunteer

internal class RetrofitVolunteersDataSource(
    private val api: VolunteersApi,
) : VolunteersRemoteDataSource {
    override suspend fun getVolunteersList(): List<Volunteer> {
        return api.getVolunteersList().let { response ->
            response.map { it.convert() }
        }
    }
}

package feedapp.insomniafest.ru.feedapp.data.volunteers.repository

import feedapp.insomniafest.ru.feedapp.domain.model.Volunteer
import feedapp.insomniafest.ru.feedapp.domain.repository.VolunteersRepository

internal class VolunteersRepositoryImpl(
    private val volunteersLocalDataSource: VolunteersLocalDataSource,
    private val volunteersRemoteDataSource: VolunteersRemoteDataSource,
) : VolunteersRepository {
    override suspend fun updateVolunteersList() {
        val response = volunteersRemoteDataSource.getVolunteersList()
        if (response.first) {
            volunteersLocalDataSource.saveRemoteResponse(response.second)
        }
    }

    override suspend fun getLocalVolunteersList(): List<Volunteer> {
        return volunteersLocalDataSource.getVolunteersList()
    }

    override suspend fun checkLogin(login: String): Boolean {
        // TODO локальная проверка логинов
        return volunteersRemoteDataSource.checkLogin(login)
    }

}

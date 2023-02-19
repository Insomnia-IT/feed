package feedapp.insomniafest.ru.feedapp.data.volunteers.repository

import feedapp.insomniafest.ru.feedapp.domain.model.Volunteer
import feedapp.insomniafest.ru.feedapp.domain.repository.VolunteersRepository

internal class VolunteersRepositoryImpl(
    private val volunteersLocalDataSource: VolunteersLocalDataSource,
    private val volunteersRemoteDataSource: VolunteersRemoteDataSource,
) : VolunteersRepository {
    override suspend fun loadVolunteersList(): List<Volunteer> {
        return volunteersRemoteDataSource.getVolunteersList()
            .also { volunteersLocalDataSource.saveRemoteResponse(it) }    }

    override suspend fun getLocalVolunteersList(): List<Volunteer> {
        return volunteersLocalDataSource.getVolunteersList()
    }

    override suspend fun getLocalElseLoad(): List<Volunteer> {
        val localData = volunteersLocalDataSource.getVolunteersList()

        return localData.ifEmpty { loadVolunteersList() }
    }

}

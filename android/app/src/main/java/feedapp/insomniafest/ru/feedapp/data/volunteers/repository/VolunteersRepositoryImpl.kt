package feedapp.insomniafest.ru.feedapp.data.volunteers.repository

import feedapp.insomniafest.ru.feedapp.domain.model.Volunteer
import feedapp.insomniafest.ru.feedapp.domain.repository.VolunteersRepository

internal class VolunteersRepositoryImpl(
    private val volunteersLocalDataSource: VolunteersLocalDataSource?,
    private val volunteersRemoteDataSource: VolunteersRemoteDataSource,
) : VolunteersRepository {
    override suspend fun getVolunteersList(): List<Volunteer> {
        return volunteersRemoteDataSource.getVolunteersList() // TODO Room
    }

}

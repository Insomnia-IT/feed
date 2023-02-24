package feedapp.insomniafest.ru.feedapp.data.volunteers.repository

import feedapp.insomniafest.ru.feedapp.domain.model.Volunteer

interface VolunteersLocalDataSource {
    suspend fun getVolunteersList(): List<Volunteer>
    suspend fun getAllVolunteersList(): List<Volunteer>

    suspend fun saveRemoteResponse(response: List<Volunteer>)

    suspend fun getSavedLogins(): List<String>

    suspend fun resetDatabaseIfNecessary(): Boolean
}

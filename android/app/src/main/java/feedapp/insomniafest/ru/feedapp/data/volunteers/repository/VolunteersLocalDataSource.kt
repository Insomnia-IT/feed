package feedapp.insomniafest.ru.feedapp.data.volunteers.repository

import feedapp.insomniafest.ru.feedapp.domain.model.Volunteer
import feedapp.insomniafest.ru.feedapp.domain.model.VolunteerId

interface VolunteersLocalDataSource {
    suspend fun getVolunteersList(): List<Volunteer>
    suspend fun getAllVolunteersList(): List<Volunteer>
    suspend fun getVolunteerByQr(qr: String): Volunteer?
    suspend fun saveRemoteResponse(response: List<Volunteer>)
    suspend fun getLastUpdate(): String

    suspend fun getSavedLogins(): List<String>

    suspend fun resetDatabaseIfNecessary(): Boolean

    suspend fun decFeedCounterById(volunteerId: VolunteerId)
}

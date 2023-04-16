package feedapp.insomniafest.ru.feedapp.domain.repository

import feedapp.insomniafest.ru.feedapp.domain.model.FeedType
import feedapp.insomniafest.ru.feedapp.domain.model.Volunteer
import feedapp.insomniafest.ru.feedapp.domain.model.VolunteerId

interface VolunteersRepository {
    suspend fun updateVolunteersList()
    suspend fun getLocalVolunteersList(): List<Volunteer>
    suspend fun getVolunteerByQr(qr: String): Volunteer?
    suspend fun checkLogin(login: String): Boolean
    suspend fun getLastUpdate(): String
    suspend fun resetDatabaseIfNecessary(): Boolean
    suspend fun decFeedCounterById(volunteerId: VolunteerId)
    suspend fun getVolunteersForPeriodByFeedType(from: Long, to: Long, feedType: FeedType): List<Volunteer>
}

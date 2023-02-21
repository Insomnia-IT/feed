package feedapp.insomniafest.ru.feedapp.domain.repository

import feedapp.insomniafest.ru.feedapp.domain.model.Volunteer

interface VolunteersRepository {
    suspend fun updateVolunteersList()
    suspend fun getLocalVolunteersList(): List<Volunteer>
}

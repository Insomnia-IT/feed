package feedapp.insomniafest.ru.feedapp.domain.repository

import feedapp.insomniafest.ru.feedapp.domain.model.Volunteer

interface VolunteersRepository {
    suspend fun loadVolunteersList(): List<Volunteer>
    suspend fun getLocalVolunteersList(): List<Volunteer>
    suspend fun getLocalElseLoad(): List<Volunteer>
}

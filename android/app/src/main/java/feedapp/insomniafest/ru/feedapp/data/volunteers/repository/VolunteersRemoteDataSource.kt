package feedapp.insomniafest.ru.feedapp.data.volunteers.repository

import feedapp.insomniafest.ru.feedapp.domain.model.Volunteer

interface VolunteersRemoteDataSource {
    suspend fun getVolunteersList(): List<Volunteer>
}
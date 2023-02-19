package feedapp.insomniafest.ru.feedapp.data.volunteers.room

import com.google.gson.Gson
import feedapp.insomniafest.ru.feedapp.common.util.fromJson
import feedapp.insomniafest.ru.feedapp.data.volunteers.dao.VolunteerEntity
import feedapp.insomniafest.ru.feedapp.data.volunteers.dao.VolunteersListDao
import feedapp.insomniafest.ru.feedapp.data.volunteers.repository.VolunteersLocalDataSource
import feedapp.insomniafest.ru.feedapp.domain.model.Volunteer

class RoomVolunteersDataSource(
    private val gson: Gson,
    private val volunteersListDao: VolunteersListDao,
) : VolunteersLocalDataSource {
    override suspend fun getVolunteersList(): List<Volunteer> {
        return volunteersListDao.loadAllVolunteers().map { it.toVolunteer(gson) }
    }

    override suspend fun saveRemoteResponse(response: List<Volunteer>) {
        return volunteersListDao.saveAllVolunteers(response.map { it.toVolunteerEntity(gson) })
    }
}

private fun VolunteerEntity.toVolunteer(gson: Gson): Volunteer {

    return Volunteer(
        id = id,
        name = name,
        nickname = nickname,
        qr = qr,
        isActive = isActive,
        isBlocked = isBlocked,
        paid = paid,
        feedType = feedType,
        activeFrom = activeFrom?.toBigDecimal(),// TODO
        activeTo = activeTo?.toBigDecimal(),// TODO
        department = gson.fromJson(department),
        location = gson.fromJson(location),
        expired = expired,
        balance = balance,
    )
}

private fun Volunteer.toVolunteerEntity(gson: Gson) = VolunteerEntity(
    id = id,
    name = name,
    nickname = nickname,
    qr = qr,
    isActive = isActive,
    isBlocked = isBlocked,
    paid = paid,
    feedType = feedType,
    activeFrom = activeFrom?.toInt(),// TODO
    activeTo = activeTo?.toInt(),// TODO
    department = gson.toJson(department),
    location = gson.toJson(location),
    expired = expired,
    balance = balance,
)

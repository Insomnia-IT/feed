package feedapp.insomniafest.ru.feedapp.data.volunteers.room

import androidx.core.text.isDigitsOnly
import com.google.gson.Gson
import feedapp.insomniafest.ru.feedapp.common.util.fromJson
import feedapp.insomniafest.ru.feedapp.data.pref.AppPreference
import feedapp.insomniafest.ru.feedapp.data.volunteers.dao.LoginDao
import feedapp.insomniafest.ru.feedapp.data.volunteers.dao.LoginEntity
import feedapp.insomniafest.ru.feedapp.data.volunteers.dao.VolunteerEntity
import feedapp.insomniafest.ru.feedapp.data.volunteers.dao.VolunteersListDao
import feedapp.insomniafest.ru.feedapp.data.volunteers.repository.VolunteersLocalDataSource
import feedapp.insomniafest.ru.feedapp.domain.model.Volunteer

class RoomVolunteersDataSource(
    private val gson: Gson,
    private val volunteersListDao: VolunteersListDao,
    private val loginDao: LoginDao,
    private val appPreference: AppPreference,
) : VolunteersLocalDataSource {
    override suspend fun getVolunteersList(): List<Volunteer> {
        val loginId = loginDao.getLogin(appPreference.login)
        val volunteersByLogin =
            volunteersListDao.getVolunteersByLogin(loginId.login).first() // TODO убрать first
        return volunteersByLogin.volunteers.map { it.toVolunteer(gson) }
    }

    /**
     * Используется только для дебага
     **/
    override suspend fun getAllVolunteersList(): List<Volunteer> {
        val volunteersByLogin =
            volunteersListDao.getAllVolunteers()
        return volunteersByLogin.flatMap { it.volunteers.map { vol -> vol.toVolunteer(gson) } }
    }

    override suspend fun saveRemoteResponse(response: List<Volunteer>) {
        loginDao.addLogin(LoginEntity(login = appPreference.login))
        val loginId = loginDao.getLogin(appPreference.login)
        return volunteersListDao.saveAllVolunteersByLogin(response.map {
            it.toVolunteerEntity(
                gson,
                loginId.login
            )
        })
    }

    override suspend fun getSavedLogins(): List<String> {
        return loginDao.getAllLogin().map { it.login }
    }
}

private fun VolunteerEntity.toVolunteer(gson: Gson): Volunteer {

    return Volunteer(
        id = id,
        login_id = login_id,
        name = name,
        nickname = nickname,
        qr = qr,
        isActive = isActive,
        isBlocked = isBlocked,
        paid = paid,
        feedType = feedType,
        activeFrom = activeFrom.getDouble(),
        activeTo = activeTo.getDouble(),
        department = gson.fromJson(department),
        location = gson.fromJson(location),
        expired = expired,
        balance = balance,
    )
}

private fun String?.getDouble(): Double? {
    return if (this != null && this.isDigitsOnly()) this.toDouble() else null
}

private fun Volunteer.toVolunteerEntity(gson: Gson, loginId: String) = VolunteerEntity(
    id = id,
    login_id = loginId,
    name = name,
    nickname = nickname,
    qr = qr,
    isActive = isActive,
    isBlocked = isBlocked,
    paid = paid,
    feedType = feedType,
    activeFrom = activeFrom.toString(),
    activeTo = activeTo.toString(),
    department = gson.toJson(department),
    location = gson.toJson(location),
    expired = expired,
    balance = balance,
)

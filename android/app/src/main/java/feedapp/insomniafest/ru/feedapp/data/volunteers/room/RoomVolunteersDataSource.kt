package feedapp.insomniafest.ru.feedapp.data.volunteers.room

import com.google.gson.Gson
import feedapp.insomniafest.ru.feedapp.common.util.*
import feedapp.insomniafest.ru.feedapp.data.pref.AppPreference
import feedapp.insomniafest.ru.feedapp.data.volunteers.dao.LoginDao
import feedapp.insomniafest.ru.feedapp.data.volunteers.dao.LoginEntity
import feedapp.insomniafest.ru.feedapp.data.volunteers.dao.VolunteerEntity
import feedapp.insomniafest.ru.feedapp.data.volunteers.dao.VolunteersListDao
import feedapp.insomniafest.ru.feedapp.data.volunteers.repository.VolunteersLocalDataSource
import feedapp.insomniafest.ru.feedapp.domain.model.FeedType
import feedapp.insomniafest.ru.feedapp.domain.model.LoginId
import feedapp.insomniafest.ru.feedapp.domain.model.Volunteer
import feedapp.insomniafest.ru.feedapp.domain.model.VolunteerId
import feedapp.insomniafest.ru.feedapp.presentation.statistics.compareDates

class RoomVolunteersDataSource(
    private val gson: Gson,
    private val volunteersListDao: VolunteersListDao,
    private val loginDao: LoginDao,
    private val appPreference: AppPreference,
) : VolunteersLocalDataSource {
    override suspend fun getVolunteersList(): List<Volunteer> {
        val loginId = loginDao.getLogin(appPreference.login)
        val volunteersByLogin = volunteersListDao.getVolunteersByLogin(loginId.login).first()
        return volunteersByLogin.volunteers.map { it.toVolunteer(gson) }
    }

    /**
     * Используется только для дебага
     **/
    override suspend fun getAllVolunteersList(): List<Volunteer> {
        val volunteersByLogin = volunteersListDao.getAllVolunteers()
        return volunteersByLogin.flatMap { it.volunteers.map { vol -> vol.toVolunteer(gson) } }
    }

    override suspend fun getVolunteersForPeriodByFeedType(
        from: Long,
        to: Long,
        feedType: FeedType,
    ): List<Volunteer> {
        val volunteers = getVolunteersList()
        // TODO не учитываются волонтеры с открытой датой
        val volunteerByPeriod = volunteers.filter {
            compareDates(from, it.activeFrom) == IsCurrentTime.MORE &&
                compareDates(to, it.activeTo) == IsCurrentTime.LESS
        }
        return when (feedType) {
            FeedType.UNKNOWN -> volunteerByPeriod
            else -> volunteerByPeriod.filter { it.feedType == feedType }
        }
    }

    override suspend fun getVolunteerByQr(qr: String): Volunteer? {
        val allVolunteers = getVolunteersList()
        return allVolunteers.find { it.qr == qr }
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

    override suspend fun getLastUpdate(): String {
        return msToString(appPreference.lastUpdate, "EEE, d MMM yyyy HH:mm:ss ")
    }

    override suspend fun getSavedLogins(): List<String> {
        return loginDao.getAllLogin().map { it.login }
    }

    override suspend fun resetDatabaseIfNecessary(): Boolean {
        return isNeedResetDatabase(appPreference.lastUpdate).also {
            if (it) {
                volunteersListDao.deleteAllVolunteers()
                loginDao.deleteAllLogins()
            }
        }
    }

    override suspend fun decFeedCounterById(volunteerId: VolunteerId) {
        val volunteer = volunteersListDao.getVolunteerById(volunteerId.id)
        if (volunteer.balance == null || volunteer.balance <= 0) throw Error("Отрицательный баланс кормления")
        val decFeedVolunteer = volunteer.copy(balance = volunteer.balance.dec())
        volunteersListDao.updateVolunteer(decFeedVolunteer)
    }
}

private fun VolunteerEntity.toVolunteer(gson: Gson) = Volunteer(
    id = VolunteerId(id),
    login_id = LoginId(login_id),
    name = name,
    nickname = nickname,
    qr = qr,
    isActive = isActive,
    isBlocked = isBlocked,
    paid = paid,
    feedType = FeedType.fromValue(feedType),
    activeFrom = activeFrom.getLong(),
    activeTo = activeTo.getLong(),
    department = gson.fromJson(department),
    location = gson.fromJson(location),
    expired = expired,
    balance = balance,
)

private fun Volunteer.toVolunteerEntity(gson: Gson, loginId: String) = VolunteerEntity(
    id = id.id,
    login_id = loginId,
    name = name,
    nickname = nickname,
    qr = qr,
    isActive = isActive,
    isBlocked = isBlocked,
    paid = paid,
    feedType = feedType.value,
    activeFrom = activeFrom?.toString(),
    activeTo = activeTo?.toString(),
    department = gson.toJson(department),
    location = gson.toJson(location),
    expired = expired,
    balance = balance,
)

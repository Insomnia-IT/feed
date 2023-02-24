package feedapp.insomniafest.ru.feedapp.data.volunteers.repository

import android.util.Log
import feedapp.insomniafest.ru.feedapp.domain.model.Volunteer
import feedapp.insomniafest.ru.feedapp.domain.repository.VolunteersRepository

internal class VolunteersRepositoryImpl(
    private val volunteersLocalDataSource: VolunteersLocalDataSource,
    private val volunteersRemoteDataSource: VolunteersRemoteDataSource,
) : VolunteersRepository {
    override suspend fun updateVolunteersList() {
        val response = volunteersRemoteDataSource.getVolunteersList()
        if (response.first) {
            volunteersLocalDataSource.saveRemoteResponse(response.second)
        } else {
            // т.к. запрос только из авторизованной зоны, то это исключение не должно быть достижимо
            throw RuntimeException("Некорректный логин")
        }
    }

    override suspend fun getLocalVolunteersList(): List<Volunteer> {
        return volunteersLocalDataSource.getVolunteersList()
    }

    override suspend fun checkLogin(login: String): Boolean {
        val savedLogins = volunteersLocalDataSource.getSavedLogins()
        Log.e("!@#$", "Login ${savedLogins.toString()} | $login | ${login in savedLogins}")
        return if (login in savedLogins) {
            true
        } else {
            volunteersRemoteDataSource.checkLogin(login)
        }
    }

    override suspend fun resetDatabaseIfNecessary(): Boolean {
        return volunteersLocalDataSource.resetDatabaseIfNecessary()
    }
}

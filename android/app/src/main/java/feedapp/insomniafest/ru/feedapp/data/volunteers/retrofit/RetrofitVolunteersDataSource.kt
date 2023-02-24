package feedapp.insomniafest.ru.feedapp.data.volunteers.retrofit

import feedapp.insomniafest.ru.feedapp.common.util.convertList
import feedapp.insomniafest.ru.feedapp.data.pref.AppPreference
import feedapp.insomniafest.ru.feedapp.data.volunteers.VolunteersApi
import feedapp.insomniafest.ru.feedapp.data.volunteers.repository.VolunteersRemoteDataSource
import feedapp.insomniafest.ru.feedapp.data.volunteers.util.getCurTime
import feedapp.insomniafest.ru.feedapp.domain.model.Volunteer

internal class RetrofitVolunteersDataSource(
    private val api: VolunteersApi,
    private val appPreference: AppPreference,
) : VolunteersRemoteDataSource {
    override suspend fun getVolunteersList(): Pair<Boolean, List<Volunteer>> {
        val response = api.getVolunteersList(appPreference.login.loginPreparation())
        if (response.isSuccessful) appPreference.lastUpdate = getCurTime()
        return response.isSuccessful to response.body().convertList()
    }

    override suspend fun checkLogin(login: String): Boolean {
        return api.checkLogin(login.loginPreparation()).isSuccessful.also {
            if (it) appPreference.login = login // При успешной авторизации сохраняем логин
        }
    }
}

private fun String.loginPreparation() = "Bearer $this"

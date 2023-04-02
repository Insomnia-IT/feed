package feedapp.insomniafest.ru.feedapp.data.eating_type

import feedapp.insomniafest.ru.feedapp.data.pref.AppPreference
import feedapp.insomniafest.ru.feedapp.domain.model.EatingType
import feedapp.insomniafest.ru.feedapp.domain.repository.EatingTypeRepository

internal class EatingTypeRepositoryImpl(
    private val appPreference: AppPreference,
) : EatingTypeRepository {
    override suspend fun saveEatingType(type: EatingType) {
        appPreference.eatingType = type.ordinal
    }

    override suspend fun getEatingType(): EatingType {
        return EatingType.fromOrdinal(appPreference.eatingType)
    }
}

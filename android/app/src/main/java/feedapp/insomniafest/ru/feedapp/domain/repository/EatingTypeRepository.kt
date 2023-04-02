package feedapp.insomniafest.ru.feedapp.domain.repository

import feedapp.insomniafest.ru.feedapp.domain.model.EatingType

interface EatingTypeRepository {
    suspend fun saveEatingType(type: EatingType)

    suspend fun getEatingType(): EatingType
}

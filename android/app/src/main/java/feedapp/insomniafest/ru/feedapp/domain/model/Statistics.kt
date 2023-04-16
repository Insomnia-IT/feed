package feedapp.insomniafest.ru.feedapp.domain.model

import java.io.Serializable

data class Statistics(
    val eatingType: EatingType,
    val fact: Int,
    val planned: Int,
) : Serializable

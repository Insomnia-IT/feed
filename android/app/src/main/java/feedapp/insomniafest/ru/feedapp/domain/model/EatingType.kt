package feedapp.insomniafest.ru.feedapp.domain.model

/**
 * @param value до какого часа длится
 */
enum class EatingType(val value: Int) {
    TOTAL(0),
    LATE_DINNER(4),
    BREAKFAST(11),
    LUNCH(16),
    DINNER(23);

    companion object {
        fun fromValue(value: Int) = EatingType.values().first { it.value == value }

        fun getTypeByHour(hour: Int): EatingType {
            return when {
                hour < LATE_DINNER.value -> LATE_DINNER
                hour < BREAKFAST.value -> BREAKFAST
                hour < LUNCH.value -> LUNCH
                hour < DINNER.value -> DINNER
                else -> LATE_DINNER
            }
        }
    }

    override fun toString(): String = when(this) {
        BREAKFAST -> "Завтрак"
        LUNCH -> "Обед"
        DINNER -> "Ужин"
        LATE_DINNER -> "Ночной дожор"
        TOTAL -> "Всего"
    }
}

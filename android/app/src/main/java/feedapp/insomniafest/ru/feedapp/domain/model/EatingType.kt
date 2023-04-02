package feedapp.insomniafest.ru.feedapp.domain.model

enum class EatingType(val value: Int) {
    BREAKFAST(0),
    LUNCH(1),
    DINNER(2),
    LATE_DINNER(3);

    companion object {
        fun fromOrdinal(value: Int) = EatingType.values().first { it.value == value }
    }
}

package feedapp.insomniafest.ru.feedapp.domain.model

enum class FeedType(val value: String) {
    UNKNOWN("FT0"),
    MEAT_EATER("FT1"),
    VEGETARIAN("FT2");

    companion object {
        fun fromValue(value: String?): FeedType {
            return FeedType.values().firstOrNull { it.value == value } ?: UNKNOWN
        }
    }

    override fun toString(): String = when (this) {
        UNKNOWN -> "Не указано"
        MEAT_EATER -> "Мясоед"
        VEGETARIAN -> "Вегетарианец"
    }
}


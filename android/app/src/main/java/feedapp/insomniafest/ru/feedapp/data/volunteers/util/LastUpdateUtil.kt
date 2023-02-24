package feedapp.insomniafest.ru.feedapp.data.volunteers.util

import java.util.*

fun getCurTime() = Date().time

const val fourHour = 1000 * 60 * 60 * 4 // 4 часа

fun isNeedResetDatabase(lastUpdate: Long): Boolean {
    val lastUp = Date(lastUpdate)
    val curDate = Date()

    val isNextDay = lastUp.day != curDate.day
    val curMidnight = Date(curDate.year, curDate.month, curDate.date)

    // если последнее обновление было вчера и прошло 4 часа с полуночи, то базу нужно сбросить
    return when {
        !isNextDay -> false
        (curDate.time - curMidnight.time) > fourHour -> true
        else -> false
    }
}

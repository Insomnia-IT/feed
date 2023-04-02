package feedapp.insomniafest.ru.feedapp.common.util

import java.text.SimpleDateFormat
import java.util.*

fun getCurTime() = Date().time

enum class IsCurrentTime {
    LESS,
    SAME,
    MORE,
    NONE,
}

fun compareWithCurTime(milliseconds: Long?): IsCurrentTime {
    if (milliseconds == null) return IsCurrentTime.NONE

    val curTime = getCurTime()
    return when {
        curTime > milliseconds -> IsCurrentTime.MORE
        curTime < milliseconds -> IsCurrentTime.LESS
        else -> IsCurrentTime.SAME
    }
}


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

fun msToString(ms: Long): String =
    SimpleDateFormat("EEE, MMM d", Locale.getDefault()).format(Date(ms))

// можно передавать паттерн, но мне влом
fun msToString4Login(ms: Long): String =
    SimpleDateFormat("EEE, d MMM yyyy HH:mm:ss ", Locale.getDefault()).format(Date(ms))


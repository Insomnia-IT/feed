package feedapp.insomniafest.ru.feedapp.presentation.statistics

import feedapp.insomniafest.ru.feedapp.common.util.IsCurrentTime
import java.util.*

fun getPeriodOfDay(year: Int, month: Int, day: Int): Pair<Long, Long> {
    val beginDay = Calendar.getInstance().also { it.set(year, month, day, 0, 0) }
    val endDay = Calendar.getInstance().also { it.set(year, month, day, 23, 59) }
    return beginDay.time.time to endDay.time.time
}

fun compareDates(first: Long?, second: Long?): IsCurrentTime {
    if (first == null || second == null) return IsCurrentTime.NONE

    return when {
        first > second -> IsCurrentTime.MORE
        first < second -> IsCurrentTime.LESS
        else -> IsCurrentTime.SAME
    }
}

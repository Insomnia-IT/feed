package feedapp.insomniafest.ru.feedapp.common.util

import androidx.core.text.isDigitsOnly

fun String?.getLong(): Long? {
    return if (this != null && this.isDigitsOnly()) this.toLong() else null
}

package feedapp.insomniafest.ru.feedapp.common

interface Dto<out Model> {

    fun convert(): Model
}

fun <T> getNotNull(item: T?, field: String): T = item ?: convertError("'$field' must not be null")

fun <T> List<Dto<T>>?.convertList(): List<T> = this?.map { it.convert() }.orEmpty()

fun convertError(error: String): Nothing = throw ConvertDtoException(error)

class ConvertDtoException(message: String) : RuntimeException(message)
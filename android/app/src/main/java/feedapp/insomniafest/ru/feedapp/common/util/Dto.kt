package feedapp.insomniafest.ru.feedapp.common.util

import android.util.Log
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

interface Dto<out Model> {

    fun convert(): Model
}

fun <T> getNotNull(item: T?, field: String): T = item ?: convertError("'$field' must not be null")

fun <T> List<Dto<T>>?.convertList(): List<T> {
    return this?.mapNotNull {
        try {
            it.convert()
        } catch (e: Exception) {
            Log.w("ResponseConverter", "", e)
            null
        }
    }.orEmpty()
}


fun convertError(error: String): Nothing = throw ConvertDtoException(error)

class ConvertDtoException(message: String) : RuntimeException(message)

inline fun <reified T> Gson.fromJson(json: String): T = fromJson<T>(json, object: TypeToken<T>() {}.type)

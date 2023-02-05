package feedapp.insomniafest.ru.feedapp.data.network

import android.util.Log
import feedapp.insomniafest.ru.feedapp.common.util.Dto
import retrofit2.Response

sealed class ApiError(override val message: String = "") : RuntimeException(message) {
    class CommonError(message: String, val code: String) : ApiError(message)
}

object ResponseConverter {
    fun <DtoT, T> convert(response: Response<DtoT>): T? where DtoT : Dto<T> {
        return try {
            if (response.isSuccessful) {
                response.body()!!.convert()
            } else {
                throw ApiError.CommonError(response.message(), response.code().toString())
            }
        } catch (e: Exception) {
            when(e) {
                is ApiError.CommonError -> Log.e("ResponseConverter", "${e.message} ${e.code}", e)
                else -> Log.e("ResponseConverter", "", e)
            }
            null
        }
    }
}
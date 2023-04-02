package feedapp.insomniafest.ru.feedapp.data.transactions

import feedapp.insomniafest.ru.feedapp.data.transactions.dto.TransactionDto
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST

internal interface TransactionApi {
    @POST("./upload_transactions")
    suspend fun sendTransaction(
        @Header("authorization") auth: String,
        @Body body: TransactionDto,
    ): retrofit2.Response<Unit>
}

package feedapp.insomniafest.ru.feedapp.data.transactions.retrofit

import feedapp.insomniafest.ru.feedapp.data.pref.AppPreference
import feedapp.insomniafest.ru.feedapp.data.transactions.TransactionApi
import feedapp.insomniafest.ru.feedapp.data.transactions.dto.TransactionDto
import feedapp.insomniafest.ru.feedapp.data.transactions.repository.TransactionRemoteDataSource
import feedapp.insomniafest.ru.feedapp.domain.model.Transaction

internal class RetrofitTransactionsDataSource(
    private val api: TransactionApi,
    private val appPreference: AppPreference,
) : TransactionRemoteDataSource {

    override suspend fun sendTransaction(transaction: Transaction): Boolean {
        val response = api.sendTransaction(
            appPreference.login.loginPreparation(),
            TransactionDto(
                vol_id = transaction.vol_id,
                amount = "1",
                ts = transaction.ts.toString(),
                ulid = transaction.ulid,
            ),
        )
        return response.isSuccessful
    }

    private fun String.loginPreparation() = "Bearer $this"
}

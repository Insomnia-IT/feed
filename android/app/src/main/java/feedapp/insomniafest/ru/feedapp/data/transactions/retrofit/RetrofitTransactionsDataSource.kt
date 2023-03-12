package feedapp.insomniafest.ru.feedapp.data.transactions.retrofit

import feedapp.insomniafest.ru.feedapp.data.transactions.TransactionApi
import feedapp.insomniafest.ru.feedapp.data.transactions.repository.TransactionRemoteDataSource

internal class RetrofitTransactionsDataSource(
    private val api: TransactionApi,
): TransactionRemoteDataSource {

}

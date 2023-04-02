package feedapp.insomniafest.ru.feedapp.data.transactions.dto

import com.google.gson.annotations.SerializedName

class TransactionDto(
    @SerializedName("vol_id")
    val vol_id: Int,

    @SerializedName("amount")
    val amount: String,

    @SerializedName("ts")
    val ts: String,

    @SerializedName("ulid")
    val ulid: String,
)

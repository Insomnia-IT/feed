package feedapp.insomniafest.ru.feedapp.domain.model

import java.io.Serializable

data class Transaction(
    val id: Int,
    val vol_id: Int,
    val ts: Long,
    val ulid: String,
    val isSynchronized: Boolean,
) : Serializable

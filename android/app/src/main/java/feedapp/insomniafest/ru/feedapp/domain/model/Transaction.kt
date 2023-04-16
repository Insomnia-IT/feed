package feedapp.insomniafest.ru.feedapp.domain.model

import java.io.Serializable

data class Transaction(
    val id: Int,
    val volId: Int,
    val ts: Long,
    val ulid: String,
    val eatingType: EatingType,
    val feedType: FeedType,
    val isSynchronized: Boolean,
) : Serializable

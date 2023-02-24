package feedapp.insomniafest.ru.feedapp.domain.model

import java.io.Serializable

data class Volunteer(
    val id: Int,
    val login_id: String,
    val name: String?,
    val nickname: String? = null,
    val qr: String,
    val isActive: Boolean,
    val isBlocked: Boolean,
    val paid: Boolean,
    val feedType: String? = null,
    val activeFrom: Double? = null,
    val activeTo: Double? = null,
    val department: List<Department>,
    val location: List<Location>,
    val expired: Int,
    val balance: Int?,
) : Serializable

package feedapp.insomniafest.ru.feedapp.domain.model

import java.io.Serializable
import java.math.BigDecimal

data class Volunteer(
    val id: Int,
    val name: String,
    val nickname: String? = null,
    val qr: String,
    val isActive: Boolean,
    val isBlocked: Boolean,
    val paid: Boolean,
    val feedType: String? = null,
    val activeFrom: BigDecimal? = null,
    val activeTo: BigDecimal? = null,
    val department: List<Department>,
    val location: List<Location>,
    val expired: Int,
    val balance: Int,
) : Serializable
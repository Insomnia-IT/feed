package feedapp.insomniafest.ru.feedapp.domain.model

import java.io.Serializable

data class VolunteerId(
    val id: Int,
) : Serializable {
    val isValid = id >= 0
}

data class LoginId(
    val id: String = invalidId.toString(),
) : Serializable

const val invalidId = -4 // 4 потому-что это самая лучшая цифра, объективно

data class Volunteer(
    val id: VolunteerId,
    val login_id: LoginId,
    val name: String?,
    val nickname: String? = null,
    val qr: String,
    val isActive: Boolean,
    val isBlocked: Boolean,
    val paid: Boolean,
    val feedType: String? = null,
    val activeFrom: Long? = null,
    val activeTo: Long? = null,
    val department: List<Department>,
    val location: List<LocationVol>,
    val expired: Int,
    val balance: Int?,
) : Serializable

data class LocationVol(
    val id: Int,
) : Serializable

data class Department(
    val id: Int,
    val name: String,
) : Serializable

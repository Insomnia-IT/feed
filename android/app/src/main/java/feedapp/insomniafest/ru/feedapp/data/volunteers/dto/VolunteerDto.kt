package feedapp.insomniafest.ru.feedapp.data.volunteers.dto

import com.google.gson.annotations.SerializedName
import feedapp.insomniafest.ru.feedapp.common.util.Dto
import feedapp.insomniafest.ru.feedapp.common.util.convertList
import feedapp.insomniafest.ru.feedapp.common.util.getNotNull
import feedapp.insomniafest.ru.feedapp.domain.model.Volunteer
import java.math.BigDecimal

internal class VolunteerDto: Dto<Volunteer> {

    @SerializedName("id")
    private val id: Int? = null

    @SerializedName("name")
    private val name: String? = null

    @SerializedName("nickname")
    private val nickname: String? = null

    @SerializedName("qr")
    private val qr: String? = null

    @SerializedName("is_active")
    private val isActive: Boolean? = null

    @SerializedName("is_blocked")
    private val isBlocked: Boolean? = null

    @SerializedName("paid")
    private val paid: Boolean? = null

    @SerializedName("feed_type")
    private val feedType: String? = null

    @SerializedName("active_from")
    private val activeFrom: BigDecimal? = null

    @SerializedName("active_to")
    private val activeTo: BigDecimal? = null

    @SerializedName("department")
    private val department: List<DepartmentDto>? = null

    @SerializedName("location")
    private val location: List<LocationDto>? = null

    @SerializedName("expired")
    private val expired: Int? = null

    @SerializedName("balance")
    private val balance: Int? = null


    override fun convert(): Volunteer {
        return Volunteer(
            id = getNotNull(id, "Volunteer/id"),
            name = name,
            nickname = nickname,
            qr = getNotNull(qr, "Volunteer/qr"),
            isActive = getNotNull(isActive, "Volunteer/isActive"),
            isBlocked = getNotNull(isBlocked, "Volunteer/isBlocked"),
            paid = getNotNull(paid, "Volunteer/paid"),
            feedType = feedType,
            activeFrom = activeFrom,
            activeTo = activeTo,
            department = department.convertList(),
            location = location.convertList(),
            expired = getNotNull(expired, "Volunteer/expired"),
            balance = balance,
        )
    }
}

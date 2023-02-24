package feedapp.insomniafest.ru.feedapp.data.volunteers.dao

import androidx.room.Embedded
import androidx.room.Relation

data class LoginWithVolunteersEntity(
    @Embedded val user: LoginEntity,
    @Relation(
        parentColumn = "login",
        entityColumn = "login_id"
    )
    val volunteers: List<VolunteerEntity>
)

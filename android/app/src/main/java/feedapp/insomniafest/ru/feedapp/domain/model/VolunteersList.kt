package feedapp.insomniafest.ru.feedapp.domain.model

import java.io.Serializable

data class VolunteersList(
    val volunteersList: List<Volunteer>,
) : Serializable
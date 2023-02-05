package feedapp.insomniafest.ru.feedapp.data.volunteers.dto

import com.google.gson.annotations.SerializedName
import feedapp.insomniafest.ru.feedapp.common.util.Dto
import feedapp.insomniafest.ru.feedapp.common.util.getNotNull
import feedapp.insomniafest.ru.feedapp.domain.model.Department

class DepartmentDto: Dto<Department> {
    @SerializedName("id")
    private val id: Int? = null

    override fun convert(): Department {
        return Department(
            id = getNotNull(id, "Department/id")
        )
    }
}
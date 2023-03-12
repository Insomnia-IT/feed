package feedapp.insomniafest.ru.feedapp.domain.interactor

import feedapp.insomniafest.ru.feedapp.common.util.IsCurrentTime
import feedapp.insomniafest.ru.feedapp.common.util.compareWithCurTime
import feedapp.insomniafest.ru.feedapp.domain.model.Volunteer
import feedapp.insomniafest.ru.feedapp.domain.model.VolunteerId
import feedapp.insomniafest.ru.feedapp.domain.repository.TransactionRepository
import feedapp.insomniafest.ru.feedapp.domain.repository.VolunteersRepository

sealed class ScanError : Error() {
    class BlockContinue(val error: String) : ScanError()
    class CanContinue(val error: String) : ScanError()
}

class CreateTransactionInteractor(
    private val volunteersRepository: VolunteersRepository,
    private val transactionRepository: TransactionRepository,
) {
    suspend fun invoke(qr: String) {
        val volunteer = getVolunteer(qr)
        val isVolunteerAvailable = checkVolunteerAvailability(volunteer)
        if (isVolunteerAvailable) {
            transactionRepository.createTransaction(volunteer.id)
        }
    }

    private suspend fun getVolunteer(qr: String): Volunteer =
        volunteersRepository.getVolunteerByQr(qr)
            ?: throw ScanError.BlockContinue("Бейдж не найден: $qr")

    private suspend fun checkVolunteerAvailability(volunteer: Volunteer): Boolean = when {
        !volunteer.isActive -> throw ScanError.BlockContinue("Бейдж не активирован в штабе")
        volunteer.isBlocked -> throw ScanError.BlockContinue("Волонтер заблокирован")
        // TODO не обрабатываются открытые даты заезда\отъезда (пока остается так (кайфово будет исправлять это на поле))
        compareWithCurTime(volunteer.activeFrom) != IsCurrentTime.MORE -> throw ScanError.CanContinue(
            "Волонтера еще не должно быть на поле (или дата заезда не определена)"
        )
        compareWithCurTime(volunteer.activeTo) != IsCurrentTime.LESS -> throw ScanError.CanContinue(
            "Волонтера уже не должно быть на поле (или дата отъезда не определена"
        )
        (volunteer.balance
            ?: 0) < 1 -> throw ScanError.CanContinue("Истрачен баланс кормлений на сегодня")
        !availableFeedAgain(volunteer.id) -> throw ScanError.CanContinue("Волонтер уже ел за последние 3 часа")
        else -> true
    }

    // проверяем что кормили последний раз не ранее 3х часов назад
    private suspend fun availableFeedAgain(volunteerId: VolunteerId): Boolean {
        val timestampLastFeed = transactionRepository.getTransactionsByVolId(volunteerId)
        return if (timestampLastFeed.isNotEmpty()) {
            val lastFeed = timestampLastFeed.maxOf { it }
            val threeHour = 1000 * 60 * 60 * 3
            return compareWithCurTime(lastFeed + threeHour) == IsCurrentTime.MORE
        } else {
            true
        }
    }
}

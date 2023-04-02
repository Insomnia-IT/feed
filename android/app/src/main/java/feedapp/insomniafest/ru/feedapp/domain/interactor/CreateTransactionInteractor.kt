package feedapp.insomniafest.ru.feedapp.domain.interactor

import feedapp.insomniafest.ru.feedapp.common.util.IsCurrentTime
import feedapp.insomniafest.ru.feedapp.common.util.compareWithCurTime
import feedapp.insomniafest.ru.feedapp.domain.model.Volunteer
import feedapp.insomniafest.ru.feedapp.domain.model.VolunteerId
import feedapp.insomniafest.ru.feedapp.domain.repository.TransactionRepository
import feedapp.insomniafest.ru.feedapp.domain.repository.VolunteersRepository
import feedapp.insomniafest.ru.feedapp.presentation.scanner.ScanResult

class CreateTransactionInteractor(
    private val volunteersRepository: VolunteersRepository,
    private val transactionRepository: TransactionRepository,
) {
    suspend fun invoke(qr: String): Pair<Volunteer, ScanResult> {
        val volunteer = getVolunteer(qr)
        // сохраняем последнее id в любом случае (к примеру, чтобы кормить в долг)
        transactionRepository.createTransaction(volunteer.id)

        val scanResult = checkVolunteerAvailability(volunteer)

        return volunteer to scanResult
    }

    private suspend fun getVolunteer(qr: String): Volunteer =
        volunteersRepository.getVolunteerByQr(qr) ?: throw Error("Бейдж не найден: $qr")

    private suspend fun checkVolunteerAvailability(volunteer: Volunteer): ScanResult = when {
        !volunteer.isActive -> ScanResult.BlockContinue("Бейдж не активирован в штабе")
        volunteer.isBlocked -> ScanResult.BlockContinue("Бан")
        // TODO не обрабатываются открытые даты заезда\отъезда (пока остается так (кайфово будет исправлять это на поле))
        compareWithCurTime(volunteer.activeFrom) != IsCurrentTime.MORE -> ScanResult.CanContinue("Некорректная дата (волонтера еще не должно быть на поле)")
        compareWithCurTime(volunteer.activeTo) != IsCurrentTime.LESS -> ScanResult.CanContinue("Некорректная дата (волонтера уже не должно быть на поле)")
        (volunteer.balance ?: 0) < 1 -> ScanResult.CanContinue("0 кормежек")
        !availableFeedAgain(volunteer.id) -> ScanResult.CanContinue("Менее 3х часов с последнего приема пищи")
        else -> ScanResult.Success
    }

    // проверяем что кормили последний раз не ранее 3х часов назад
    private suspend fun availableFeedAgain(volunteerId: VolunteerId): Boolean {
        val timestampLastFeed = transactionRepository.getTransactionTimestampByVolId(volunteerId)
        return if (timestampLastFeed.isNotEmpty()) {
            val lastFeed = timestampLastFeed.maxOf { it }
            val threeHour = 1000 * 60 * 60 * 3
            return compareWithCurTime(lastFeed + threeHour) == IsCurrentTime.MORE
        } else {
            true
        }
    }
}

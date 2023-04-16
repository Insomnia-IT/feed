package feedapp.insomniafest.ru.feedapp.domain.interactor

import feedapp.insomniafest.ru.feedapp.domain.model.*
import feedapp.insomniafest.ru.feedapp.domain.repository.TransactionRepository
import feedapp.insomniafest.ru.feedapp.domain.repository.VolunteersRepository
import feedapp.insomniafest.ru.feedapp.presentation.statistics.getPeriodOfDay

class GetStatisticsInteractor(
    private val volunteersRepository: VolunteersRepository,
    private val transactionRepository: TransactionRepository,
) {
    suspend fun invoke(year: Int, month: Int, day: Int, feedType: FeedType): List<Statistics> {
        val (from, to) = getPeriodOfDay(year, month, day)

        val fact = transactionRepository.getTransactionsForPeriodByFeedType(
            from = from,
            to = to,
            feedType = feedType,
        )
        val planned = volunteersRepository.getVolunteersForPeriodByFeedType(
            from = from,
            to = to,
            feedType = feedType,
        )
        val plannedSize = planned.size

        val groupedFact = fact.groupBy { it.eatingType }

        return listOf(
            Statistics(
                eatingType = EatingType.TOTAL,
                fact = fact.size,
                planned = plannedSize,
            ),
            Statistics(
                eatingType = EatingType.BREAKFAST,
                fact = groupedFact.sizeByFeedType(EatingType.BREAKFAST),
                planned = plannedSize,
            ),
            Statistics(
                eatingType = EatingType.LUNCH,
                fact = groupedFact.sizeByFeedType(EatingType.LUNCH),
                planned = plannedSize,
            ),
            Statistics(
                eatingType = EatingType.DINNER,
                fact = groupedFact.sizeByFeedType(EatingType.DINNER),
                planned = plannedSize,
            ),
            Statistics(
                eatingType = EatingType.LATE_DINNER,
                fact = groupedFact.sizeByFeedType(EatingType.LATE_DINNER),
                planned = plannedSize,
            ),
        )
    }

    private fun Map<EatingType, List<Transaction>>.sizeByFeedType(type: EatingType): Int {
        return this[type]?.size ?: 0
    }
}

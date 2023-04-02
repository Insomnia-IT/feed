package feedapp.insomniafest.ru.feedapp.domain.interactor

import feedapp.insomniafest.ru.feedapp.domain.repository.TransactionRepository
import feedapp.insomniafest.ru.feedapp.domain.repository.VolunteersRepository

class SaveTransactionInteractor(
    private val volunteersRepository: VolunteersRepository,
    private val transactionRepository: TransactionRepository,
) {
    suspend fun invoke(isSaveAnyway: Boolean) {
        val volunteerId = transactionRepository.addLastTransaction(isSaveAnyway) // сохранили в бд транзакцию

        volunteersRepository.decFeedCounterById(volunteerId) // уменьшили баланс кормления

        // TODO try send
    }
}

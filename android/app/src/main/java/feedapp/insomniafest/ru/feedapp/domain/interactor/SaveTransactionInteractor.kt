package feedapp.insomniafest.ru.feedapp.domain.interactor

import feedapp.insomniafest.ru.feedapp.domain.model.Volunteer
import feedapp.insomniafest.ru.feedapp.domain.repository.EatingTypeRepository
import feedapp.insomniafest.ru.feedapp.domain.repository.TransactionRepository
import feedapp.insomniafest.ru.feedapp.domain.repository.VolunteersRepository

class SaveTransactionInteractor(
    private val volunteersRepository: VolunteersRepository,
    private val transactionRepository: TransactionRepository,
    private val eatingTypeRepository: EatingTypeRepository,
) {
    suspend fun invoke(volunteer: Volunteer) {
        val eatingType = eatingTypeRepository.getEatingType()

        transactionRepository.saveTransaction(
            volunteer = volunteer,
            eatingType = eatingType,
        ) // сохранили в бд транзакцию

        if (volunteer.id.isValid) {
            volunteersRepository.decFeedCounterById(volunteer.id) // уменьшили баланс кормления
        }

        // TODO try send
    }
}

package feedapp.insomniafest.ru.feedapp.di.modules

import dagger.Module
import dagger.Provides
import feedapp.insomniafest.ru.feedapp.data.transactions.repository.TransactionLocalDataSource
import feedapp.insomniafest.ru.feedapp.data.transactions.repository.TransactionRemoteDataSource
import feedapp.insomniafest.ru.feedapp.data.transactions.repository.TransactionRepositoryImpl
import feedapp.insomniafest.ru.feedapp.data.volunteers.repository.VolunteersLocalDataSource
import feedapp.insomniafest.ru.feedapp.data.volunteers.repository.VolunteersRemoteDataSource
import feedapp.insomniafest.ru.feedapp.data.volunteers.repository.VolunteersRepositoryImpl
import feedapp.insomniafest.ru.feedapp.domain.interactor.CreateTransactionInteractor
import feedapp.insomniafest.ru.feedapp.domain.repository.TransactionRepository
import feedapp.insomniafest.ru.feedapp.domain.repository.VolunteersRepository
import javax.inject.Singleton

@Module
class ModelModule {
    @Provides
    @Singleton
    fun providesVolunteersRepository(
        volunteersLocalDataSource: VolunteersLocalDataSource,
        volunteersRemoteDataSource: VolunteersRemoteDataSource
    ): VolunteersRepository {
        return VolunteersRepositoryImpl(volunteersLocalDataSource, volunteersRemoteDataSource)
    }

    @Provides
    @Singleton
    fun providesTransactionsRepository(
        transactionsLocalDataSource: TransactionLocalDataSource,
        transactionsRemoteDataSource: TransactionRemoteDataSource
    ): TransactionRepository {
        return TransactionRepositoryImpl(transactionsLocalDataSource, transactionsRemoteDataSource)
    }

    @Provides
    @Singleton
    fun providesCreateTransactionInteractor(
        volunteersRepository: VolunteersRepository,
        transactionRepository: TransactionRepository,
    ): CreateTransactionInteractor {
        return CreateTransactionInteractor(volunteersRepository, transactionRepository)
    }
}

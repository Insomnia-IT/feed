package feedapp.insomniafest.ru.feedapp.di.modules

import dagger.Module
import dagger.Provides
import feedapp.insomniafest.ru.feedapp.data.eating_type.EatingTypeRepositoryImpl
import feedapp.insomniafest.ru.feedapp.data.pref.AppPreference
import feedapp.insomniafest.ru.feedapp.data.transactions.repository.TransactionLocalDataSource
import feedapp.insomniafest.ru.feedapp.data.transactions.repository.TransactionRemoteDataSource
import feedapp.insomniafest.ru.feedapp.data.transactions.repository.TransactionRepositoryImpl
import feedapp.insomniafest.ru.feedapp.data.volunteers.repository.VolunteersLocalDataSource
import feedapp.insomniafest.ru.feedapp.data.volunteers.repository.VolunteersRemoteDataSource
import feedapp.insomniafest.ru.feedapp.data.volunteers.repository.VolunteersRepositoryImpl
import feedapp.insomniafest.ru.feedapp.domain.interactor.TransactionVerificationInteractor
import feedapp.insomniafest.ru.feedapp.domain.interactor.GetStatisticsInteractor
import feedapp.insomniafest.ru.feedapp.domain.interactor.SaveTransactionInteractor
import feedapp.insomniafest.ru.feedapp.domain.interactor.SendTransactionsInteractor
import feedapp.insomniafest.ru.feedapp.domain.repository.EatingTypeRepository
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
    fun providesTransactionVerificationInteractor(
        volunteersRepository: VolunteersRepository,
        transactionRepository: TransactionRepository,
    ): TransactionVerificationInteractor {
        return TransactionVerificationInteractor(volunteersRepository, transactionRepository)
    }

    @Provides
    @Singleton
    fun providesSaveTransactionInteractor(
        volunteersRepository: VolunteersRepository,
        transactionRepository: TransactionRepository,
        eatingTypeRepository: EatingTypeRepository,
    ): SaveTransactionInteractor {
        return SaveTransactionInteractor(
            volunteersRepository,
            transactionRepository,
            eatingTypeRepository
        )
    }

    @Provides
    @Singleton
    fun providesSendTransactionInteractor(
        transactionRepository: TransactionRepository,
    ): SendTransactionsInteractor {
        return SendTransactionsInteractor(transactionRepository)
    }

    @Provides
    @Singleton
    fun providesEatingTypeRepository(
        appPreference: AppPreference,
    ): EatingTypeRepository {
        return EatingTypeRepositoryImpl(appPreference)
    }

    @Provides
    @Singleton
    fun providesGetStatisticsInteractor(
        volunteersRepository: VolunteersRepository,
        transactionRepository: TransactionRepository,
    ): GetStatisticsInteractor {
        return GetStatisticsInteractor(volunteersRepository, transactionRepository)
    }
}

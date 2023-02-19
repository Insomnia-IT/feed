package feedapp.insomniafest.ru.feedapp.di.modules

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import dagger.Module
import dagger.Provides
import feedapp.insomniafest.ru.feedapp.BuildConfig
import feedapp.insomniafest.ru.feedapp.data.volunteers.VolunteersApi
import feedapp.insomniafest.ru.feedapp.data.volunteers.repository.VolunteersLocalDataSource
import feedapp.insomniafest.ru.feedapp.data.volunteers.repository.VolunteersRemoteDataSource
import feedapp.insomniafest.ru.feedapp.data.volunteers.repository.VolunteersRepositoryImpl
import feedapp.insomniafest.ru.feedapp.data.volunteers.retrofit.RetrofitVolunteersDataSource
import feedapp.insomniafest.ru.feedapp.domain.repository.VolunteersRepository
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
class NetworkModule {

    @Provides
    @Singleton
    internal fun provideVolunteersApi(retrofit: Retrofit): VolunteersApi =
        retrofit.create(VolunteersApi::class.java)

    @Provides
    @Singleton
    fun provideRetrofit(client: OkHttpClient, gson: Gson): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
    }

    @Provides
    @Singleton
    fun providesOkHttpClient(httpLoggingInterceptor: HttpLoggingInterceptor): OkHttpClient {
        return OkHttpClient.Builder().writeTimeout(1, TimeUnit.MINUTES)
            .readTimeout(1, TimeUnit.MINUTES)
            .callTimeout(1, TimeUnit.MINUTES)
            .addInterceptor(httpLoggingInterceptor)
            .addInterceptor { chain ->
                val request = chain.request().newBuilder()

                    .build()
                return@addInterceptor chain.proceed(request)
            }
            .build()
    }

    @Provides
    @Singleton
    fun providesHttpLoggingInterceptor(): HttpLoggingInterceptor {
        return if (BuildConfig.DEBUG)
            HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            }
        else
            HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.NONE
            }
    }

    @Provides
    @Singleton
    fun providesGson(): Gson {
        return GsonBuilder().create()
    }

    @Provides
    @Singleton
    internal fun providesVolunteersRemoteDataSource(api: VolunteersApi): VolunteersRemoteDataSource {
        return RetrofitVolunteersDataSource(api)
    }

    @Provides
    @Singleton
    fun providesVolunteersRepository(
        volunteersLocalDataSource: VolunteersLocalDataSource,
        volunteersRemoteDataSource: VolunteersRemoteDataSource
    ): VolunteersRepository {
        return VolunteersRepositoryImpl(volunteersLocalDataSource, volunteersRemoteDataSource)
    }
}

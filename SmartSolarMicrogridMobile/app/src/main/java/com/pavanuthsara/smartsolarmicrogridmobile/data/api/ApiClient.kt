package com.pavanuthsara.smartsolarmicrogridmobile.data.api

import android.content.Context
import com.pavanuthsara.smartsolarmicrogridmobile.data.session.SessionManager
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {

    @Volatile
    private var apiService: ApiService? = null

    @Volatile
    private var currentBaseUrl: String? = null

    fun getService(context: Context): ApiService {
        val sessionManager = SessionManager.getInstance(context)
        val baseUrl = sessionManager.getBaseUrl()

        if (apiService != null && currentBaseUrl == baseUrl) {
            return apiService!!
        }

        return synchronized(this) {
            if (apiService != null && currentBaseUrl == baseUrl) {
                apiService!!
            } else {
                currentBaseUrl = baseUrl
                val authInterceptor = Interceptor { chain ->
                    val originalRequest = chain.request()
                    val token = sessionManager.getAuthToken()

                    val newRequest = if (!token.isNullOrBlank()) {
                        originalRequest.newBuilder()
                            .header("Authorization", "Bearer $token")
                            .header("Accept", "application/json")
                            .header("Content-Type", "application/json")
                            .build()
                    } else {
                        originalRequest.newBuilder()
                            .header("Accept", "application/json")
                            .header("Content-Type", "application/json")
                            .build()
                    }
                    chain.proceed(newRequest)
                }

                val loggingInterceptor = HttpLoggingInterceptor().apply {
                    level = HttpLoggingInterceptor.Level.BODY
                }

                val okHttpClient = OkHttpClient.Builder()
                    .addInterceptor(authInterceptor)
                    .addInterceptor(loggingInterceptor)
                    .connectTimeout(30, TimeUnit.SECONDS)
                    .readTimeout(30, TimeUnit.SECONDS)
                    .writeTimeout(30, TimeUnit.SECONDS)
                    .build()

                val retrofit = Retrofit.Builder()
                    .baseUrl(baseUrl)
                    .client(okHttpClient)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build()

                val service = retrofit.create(ApiService::class.java)
                apiService = service
                service
            }
        }
    }

    fun resetClient() {
        synchronized(this) {
            apiService = null
            currentBaseUrl = null
        }
    }
}

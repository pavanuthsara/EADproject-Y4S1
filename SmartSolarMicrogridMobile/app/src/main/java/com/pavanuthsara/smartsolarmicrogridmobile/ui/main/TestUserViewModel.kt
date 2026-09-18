package com.pavanuthsara.smartsolarmicrogridmobile.ui.main

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch
import com.pavanuthsara.smartsolarmicrogridmobile.data.local.AppDatabase
import com.pavanuthsara.smartsolarmicrogridmobile.data.local.TestUser

class TestUserViewModel(application: Application) : AndroidViewModel(application) {

    // Initialize the database and DAO
    private val testUserDao = AppDatabase.getDatabase(application).testUserDao()

    fun saveUser(nic: Int, username: String, email: String, isLoggedIn: Boolean) {
        // Launch a coroutine in the background
        viewModelScope.launch {
            val newUser = TestUser(nic, username, email, isLoggedIn)
            testUserDao.insertUser(newUser)
        }
    }

}
package com.pavanuthsara.smartsolarmicrogridmobile.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction

@Dao
abstract class CachedUserDao {

    @Query("SELECT * FROM cached_user LIMIT 1")
    abstract suspend fun get(): CachedUser?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    abstract suspend fun insert(user: CachedUser)

    @Query("DELETE FROM cached_user")
    abstract suspend fun clear()

    // Keeps exactly one cached user: the one currently signed in on this device.
    @Transaction
    open suspend fun replace(user: CachedUser) {
        clear()
        insert(user)
    }
}

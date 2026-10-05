package com.pavanuthsara.smartsolarmicrogridmobile.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(entities = [TestUser::class, Prosumer::class, Reservation::class, CachedUser::class], version = 5)
abstract class AppDatabase : RoomDatabase() {
    abstract fun testUserDao(): TestUserDao
    abstract fun prosumerDao(): ProsumerDao
    abstract fun reservationDao(): ReservationDao
    abstract fun cachedUserDao(): CachedUserDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        private val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    "CREATE TABLE IF NOT EXISTS `prosumers` (`nic` TEXT NOT NULL, `fullName` TEXT NOT NULL, `email` TEXT NOT NULL, `phoneNumber` TEXT NOT NULL, `password` TEXT NOT NULL, PRIMARY KEY(`nic`))"
                )
            }
        }

        private val MIGRATION_2_3 = object : Migration(2, 3) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    "CREATE TABLE IF NOT EXISTS `reservations` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `prosumerNic` TEXT NOT NULL, `type` TEXT NOT NULL, `date` TEXT NOT NULL, `time` TEXT NOT NULL, `status` TEXT NOT NULL, `qrCodeData` TEXT)"
                )
            }
        }

        private val MIGRATION_3_4 = object : Migration(3, 4) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    "CREATE TABLE IF NOT EXISTS `cached_user` (`userId` TEXT NOT NULL, `nic` TEXT NOT NULL, `fullName` TEXT NOT NULL, `email` TEXT NOT NULL, `role` TEXT NOT NULL, PRIMARY KEY(`userId`))"
                )
            }
        }

        // Adds the phone number to the cached profile. Rows cached before this get an empty phone
        // until the user signs in again.
        private val MIGRATION_4_5 = object : Migration(4, 5) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE `cached_user` ADD COLUMN `phone` TEXT NOT NULL DEFAULT ''")
            }
        }

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "app_database"
                )
                    .addMigrations(MIGRATION_1_2, MIGRATION_2_3, MIGRATION_3_4, MIGRATION_4_5)
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
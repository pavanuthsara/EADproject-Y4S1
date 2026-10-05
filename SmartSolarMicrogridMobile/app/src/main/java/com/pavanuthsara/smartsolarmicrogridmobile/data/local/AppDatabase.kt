package com.pavanuthsara.smartsolarmicrogridmobile.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(entities = [TestUser::class, Prosumer::class, CachedReservation::class, CachedUser::class], version = 7)
abstract class AppDatabase : RoomDatabase() {
    abstract fun testUserDao(): TestUserDao
    abstract fun prosumerDao(): ProsumerDao
    abstract fun cachedReservationDao(): CachedReservationDao
    abstract fun cachedUserDao(): CachedUserDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        private val MIGRATION_1_2 = object : Migration(1, 2) {
            // Adds the prosumers table.
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    "CREATE TABLE IF NOT EXISTS `prosumers` (`nic` TEXT NOT NULL, `fullName` TEXT NOT NULL, `email` TEXT NOT NULL, `phoneNumber` TEXT NOT NULL, `password` TEXT NOT NULL, PRIMARY KEY(`nic`))"
                )
            }
        }

        private val MIGRATION_2_3 = object : Migration(2, 3) {
            // Adds the reservations table.
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    "CREATE TABLE IF NOT EXISTS `reservations` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `prosumerNic` TEXT NOT NULL, `type` TEXT NOT NULL, `date` TEXT NOT NULL, `time` TEXT NOT NULL, `status` TEXT NOT NULL, `qrCodeData` TEXT)"
                )
            }
        }

        private val MIGRATION_3_4 = object : Migration(3, 4) {
            // Adds the cached_user table for the signed-in user.
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    "CREATE TABLE IF NOT EXISTS `cached_user` (`userId` TEXT NOT NULL, `nic` TEXT NOT NULL, `fullName` TEXT NOT NULL, `email` TEXT NOT NULL, `role` TEXT NOT NULL, PRIMARY KEY(`userId`))"
                )
            }
        }

        // Adds the phone number to the cached profile. Rows cached before this get an empty phone
        // until the user signs in again.
        private val MIGRATION_4_5 = object : Migration(4, 5) {
            // Adds the phone column to cached_user.
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE `cached_user` ADD COLUMN `phone` TEXT NOT NULL DEFAULT ''")
            }
        }

        // Reservations now live in MongoDB and are only cached here. The old table held bookings made
        // on the phone alone (with a made-up Approved status and QR), so it is dropped, not converted.
        private val MIGRATION_5_6 = object : Migration(5, 6) {
            // Replaces the old reservations table with cached_reservations.
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("DROP TABLE IF EXISTS `reservations`")
                db.execSQL(
                    "CREATE TABLE IF NOT EXISTS `cached_reservations` (`reservationId` TEXT NOT NULL, `prosumerNic` TEXT NOT NULL, `reservationNo` TEXT NOT NULL, `status` TEXT NOT NULL, `stationId` TEXT NOT NULL, `stationName` TEXT NOT NULL, `slotId` TEXT NOT NULL, `slotStartUtc` TEXT NOT NULL, `slotEndUtc` TEXT NOT NULL, `direction` TEXT NOT NULL, `requestedKwh` REAL NOT NULL, `createdAtUtc` TEXT NOT NULL, `canModify` INTEGER NOT NULL, `canCancel` INTEGER NOT NULL, `rejectionReason` TEXT, PRIMARY KEY(`reservationId`))"
                )
            }
        }

        // Adds the QR token the API now sends for Approved reservations. Rows saved before this have none
        // until the next refresh from the API.
        private val MIGRATION_6_7 = object : Migration(6, 7) {
            // Adds the qrToken column to cached_reservations.
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE `cached_reservations` ADD COLUMN `qrToken` TEXT")
            }
        }

        // Returns the single database instance, creating it on first use.
        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "app_database"
                )
                    .addMigrations(MIGRATION_1_2, MIGRATION_2_3, MIGRATION_3_4, MIGRATION_4_5, MIGRATION_5_6, MIGRATION_6_7)
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.pavanuthsara.smartsolarmicrogridmobile.data.local.AppDatabase
import com.pavanuthsara.smartsolarmicrogridmobile.data.local.Reservation
import kotlinx.coroutines.launch

sealed class ReservationStatus {
    object Idle : ReservationStatus()
    object Loading : ReservationStatus()
    data class Loaded(val reservation: Reservation) : ReservationStatus()
    data class Success(val reservationId: Long) : ReservationStatus()
    object Deleted : ReservationStatus()
    data class Error(val message: String) : ReservationStatus()
}

class ReservationViewModel(application: Application) : AndroidViewModel(application) {
    private val reservationDao = AppDatabase.getDatabase(application).reservationDao()

    private val _status = MutableLiveData<ReservationStatus>(ReservationStatus.Idle)
    val status: LiveData<ReservationStatus> = _status

    private var currentReservationId: Long? = null
    
    fun loadReservation(id: Long) {
        _status.value = ReservationStatus.Loading
        viewModelScope.launch {
            try {
                val res = reservationDao.getReservationById(id)
                if (res != null) {
                    currentReservationId = res.id
                    _status.value = ReservationStatus.Loaded(res)
                } else {
                    _status.value = ReservationStatus.Error("Reservation not found.")
                }
            } catch (e: Exception) {
                _status.value = ReservationStatus.Error(e.message ?: "Unknown error")
            }
        }
    }

    fun saveReservation(nic: String, type: String, date: String, time: String) {
        viewModelScope.launch {
            try {
                if (currentReservationId != null) {
                    val res = reservationDao.getReservationById(currentReservationId!!)
                    if (res != null) {
                        val updated = res.copy(type = type, date = date, time = time, status = "Approved", qrCodeData = "QR_${res.id}_${nic}_$date")
                        reservationDao.updateReservation(updated)
                        _status.value = ReservationStatus.Success(updated.id)
                    }
                } else {
                    val newRes = Reservation(
                        prosumerNic = nic,
                        type = type,
                        date = date,
                        time = time,
                        status = "Approved",
                        qrCodeData = "PENDING" // We will update it after inserting to get the ID
                    )
                    val id = reservationDao.insertReservation(newRes)
                    
                    // Generate pseudo QR data based on ID
                    val qrData = "QR_${id}_${nic}_$date"
                    val finalRes = newRes.copy(id = id, qrCodeData = qrData)
                    reservationDao.updateReservation(finalRes)
                    
                    _status.value = ReservationStatus.Success(id)
                }
            } catch (e: Exception) {
                _status.value = ReservationStatus.Error(e.message ?: "Unknown error")
            }
        }
    }

    fun cancelReservation() {
        val id = currentReservationId ?: return
        viewModelScope.launch {
            try {
                reservationDao.deleteReservation(id)
                _status.value = ReservationStatus.Deleted
            } catch (e: Exception) {
                _status.value = ReservationStatus.Error(e.message ?: "Unknown error")
            }
        }
    }
}

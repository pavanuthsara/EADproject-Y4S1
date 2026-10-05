package com.pavanuthsara.smartsolarmicrogridmobile.ui.prosumer

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.ApiResult
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.CreateReservationRequest
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.ReservationSummaryDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.SlotDto
import com.pavanuthsara.smartsolarmicrogridmobile.data.api.models.UpdateReservationRequest
import com.pavanuthsara.smartsolarmicrogridmobile.data.local.CachedReservation
import com.pavanuthsara.smartsolarmicrogridmobile.data.repository.ReservationRepository
import com.pavanuthsara.smartsolarmicrogridmobile.data.repository.StationRepository
import kotlinx.coroutines.launch

// What the booking form shows. The form is used to create a booking (from a slot picked on the
// station screen) and to change an existing one.
sealed class FormState {
    object Loading : FormState()

    data class Ready(
        val stationName: String,
        val slots: List<SlotDto>,
        val selectedSlotId: String?,
        // Set when an existing reservation is being changed.
        val existing: CachedReservation?
    ) : FormState()

    data class LoadError(val message: String) : FormState()
}

// A result the screen reacts to once (a toast, a navigation), so it is not replayed on rotation.
sealed class FormEvent {
    data class Saved(val reservationId: String, val message: String) : FormEvent()
    data class Cancelled(val message: String) : FormEvent()
    data class Failed(val message: String) : FormEvent()
    object SessionExpired : FormEvent()
}

class ReservationViewModel(application: Application) : AndroidViewModel(application) {

    private val stationRepository = StationRepository(application)
    private val reservationRepository = ReservationRepository(application)

    private val _state = MutableLiveData<FormState>(FormState.Loading)
    val state: LiveData<FormState> = _state

    private val _busy = MutableLiveData(false)
    val busy: LiveData<Boolean> = _busy

    private val _event = MutableLiveData<ConsumableEvent<FormEvent>>()
    val event: LiveData<ConsumableEvent<FormEvent>> = _event

    private var existing: CachedReservation? = null
    private var stationId: String = ""
    private var loaded = false

    // Loads the station's bookable slots (and the reservation being changed, if any).
    fun load(stationIdExtra: String?, stationNameExtra: String?, slotId: String?, reservationId: String?) {
        if (loaded) return
        loaded = true

        viewModelScope.launch {
            val reservation = reservationId?.let { reservationRepository.cachedById(it) }
            if (reservationId != null && reservation == null) {
                _state.value = FormState.LoadError("This reservation could not be found. Go back and refresh the list.")
                return@launch
            }
            existing = reservation

            stationId = reservation?.stationId ?: stationIdExtra.orEmpty()
            val stationName = reservation?.stationName ?: stationNameExtra.orEmpty()
            if (stationId.isEmpty()) {
                _state.value = FormState.LoadError("No station was selected.")
                return@launch
            }

            when (val result = stationRepository.slots(stationId)) {
                is ApiResult.Success -> {
                    val slots = withCurrentSlot(result.data, reservation)
                    _state.value = FormState.Ready(stationName, slots, reservation?.slotId ?: slotId, reservation)
                }
                is ApiResult.Failure ->
                    if (result.sessionExpired) {
                        _event.value = ConsumableEvent(FormEvent.SessionExpired)
                    } else {
                        _state.value = FormState.LoadError(result.message)
                    }
            }
        }
    }

    // The slot a reservation is already on may no longer be listed (for example it was closed), but the
    // prosumer must still be able to keep it, so it is added from what the reservation remembers.
    private fun withCurrentSlot(slots: List<SlotDto>, reservation: CachedReservation?): List<SlotDto> {
        if (reservation == null || slots.any { it.id == reservation.slotId }) return slots

        val current = SlotDto(
            id = reservation.slotId,
            stationId = reservation.stationId,
            startTime = reservation.slotStartUtc,
            endTime = reservation.slotEndUtc,
            totalPositions = 0,
            reservedPositions = 0,
            capacityKwh = 0.0,
            reservedKwh = 0.0,
            supportedDirections = null,
            status = "Available"
        )
        return (slots + current).sortedBy { it.startTime }
    }

    // Books a new reservation on the chosen slot.
    fun book(slotId: String, direction: String, kwh: Double) {
        runAction {
            when (val result = reservationRepository.create(CreateReservationRequest(stationId, slotId, direction, kwh))) {
                is ApiResult.Success -> FormEvent.Saved(result.data.reservationId, summaryMessage(result.data, result.message))
                is ApiResult.Failure -> failure(result)
            }
        }
    }

    // Sends only what changed; the API refuses an empty update, so "no changes" is caught here.
    fun saveChanges(slotId: String, direction: String, kwh: Double) {
        val current = existing ?: return
        val request = UpdateReservationRequest(
            slotId = slotId.takeIf { it != current.slotId },
            direction = direction.takeIf { it != current.direction },
            requestedKwh = kwh.takeIf { it != current.requestedKwh }
        )
        if (request.slotId == null && request.direction == null && request.requestedKwh == null) {
            _event.value = ConsumableEvent(FormEvent.Failed("You have not changed anything."))
            return
        }

        runAction {
            when (val result = reservationRepository.update(current.reservationId, request)) {
                is ApiResult.Success -> FormEvent.Saved(result.data.reservationId, summaryMessage(result.data, result.message))
                is ApiResult.Failure -> failure(result)
            }
        }
    }

    // Cancels the reservation being edited.
    fun cancelReservation() {
        val current = existing ?: return
        runAction {
            when (val result = reservationRepository.cancel(current.reservationId)) {
                is ApiResult.Success -> FormEvent.Cancelled(summaryMessage(result.data, result.message))
                is ApiResult.Failure -> failure(result)
            }
        }
    }

    // Runs one API action at a time and publishes its outcome as an event.
    private fun runAction(action: suspend () -> FormEvent) {
        if (_busy.value == true) return
        _busy.value = true
        viewModelScope.launch {
            val outcome = action()
            _busy.value = false
            _event.value = ConsumableEvent(outcome)
        }
    }

    // Turns an API failure into a session-expired or error event.
    private fun failure(result: ApiResult.Failure): FormEvent =
        if (result.sessionExpired) FormEvent.SessionExpired else FormEvent.Failed(result.message)

    // The API's own sentence ("Reservation created and awaiting operator approval.") is shown as it is.
    private fun summaryMessage(dto: ReservationSummaryDto, apiMessage: String): String =
        dto.message?.takeIf { it.isNotBlank() } ?: apiMessage
}

// Holds a value that is handed out only once.
class ConsumableEvent<out T>(private val content: T) {
    private var handled = false

    // Returns the content the first time only; later calls return null.
    fun consume(): T? = if (handled) null else { handled = true; content }
}

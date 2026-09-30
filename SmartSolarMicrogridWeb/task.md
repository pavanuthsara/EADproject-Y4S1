# Development Tasks & Reminders

## Frontend: Prosumer Management API Integration

**Context:** The `ProsumerManagement.jsx` UI was built using a mock service layer to unblock frontend development. Currently, `src/services/prosumerService.js` uses hardcoded data and simulated network delays.

**To-Do:**
- [ ] Ensure backend endpoints for Prosumer Management are fully implemented and running (expected at `http://localhost:5014/api/prosumers`).
- [ ] Update `src/services/prosumerService.js`:
  - [ ] Remove the `mockProsumers` array and `delay` function.
  - [ ] Replace `getProsumers()` with a `fetch` GET request.
  - [ ] Replace `createProsumer(data)` with a `fetch` POST request.
  - [ ] Replace `updateProsumer(nic, data)` with a `fetch` PUT request.
  - [ ] Replace `updateProsumerStatus(nic, newStatus)` with a `fetch` PATCH or PUT request.
- [ ] Ensure the backend returns standard HTTP status codes so the frontend error handling (`catch (err)`) works correctly.
- [ ] Verify that authentication tokens (JWT) are being passed in the headers of these new fetch requests, as required by the backend.

## Frontend: Microgrid Node Management API Integration

**Context:** The `NodeManagement.jsx` UI uses a mock service `src/services/nodeService.js`.

**To-Do:**
- [ ] Connect `getNodes()` to backend (GET request).
- [ ] Connect `createNode(data)` to backend (POST request).
- [ ] Connect `updateNodeSchedule(id, newSchedule)` to backend (PATCH/PUT request).
- [ ] Connect `deactivateNode(id)` and `activateNode(id)` to backend.
- [ ] Ensure backend implements the exact same validation to block node deactivation if active energy reservations exist.

## Frontend: Energy Slot Reservation Management API Integration

**Context:** `ReservationManagement.jsx` is mounted on both the Backoffice and Grid
Operator dashboards and uses the mock service `src/services/reservationService.js`.
The shapes it returns already match the API's `ReservationSummaryResponse`, so the
component should not need changes when the service is wired up.

The 7-day and 12-hour rules live in `src/utils/reservationRules.js` and mirror the
API's `ReservationPolicy` configuration section. The API stays the authority; the
UI copy only blocks requests early and explains why.

**To-Do:**
- [ ] Connect `getReservations()` to `GET /api/reservations/history`.
- [ ] Connect `createReservation(data)` to `POST /api/reservations`.
- [ ] Connect `updateReservation(id, data)` to `PUT /api/reservations/{id}`.
- [ ] Connect `cancelReservation(id)` to `DELETE /api/reservations/{id}`.
- [ ] Read `canModify` / `canCancel` from the API response instead of deriving them
      locally in `withDerivedFlags()`, and keep deriving only for the live countdown.
- [ ] Pass the JWT bearer token on every request, as the other services will.
- [ ] Surface `ReservationPolicy` from the API (a small GET, or an existing config
      endpoint) so `getReservationPolicy()` stops returning local constants and the
      UI cannot drift from `BookingWindowDays` / `MinimumNoticeHours`.

**Blocking API gaps for the web app:**
- [ ] `ReservationsController` is `[Authorize(Roles = Prosumer)]` only, and every
      action reads the prosumer identity from the token. Backoffice and Grid Operator
      staff therefore cannot list, create, update or cancel bookings through it.
      Either widen the roles and accept a prosumer NIC on staff requests, or add
      staff endpoints. Requirement 4.4 expects staff to do all four, and requirement
      4.4 also expects Grid Operators to "assist with cancellations".
- [ ] `GET /api/reservations/history` filters by the caller's own NIC. Staff need a
      list across all prosumers, with the existing `fromUtc` / `toUtc` / `status` /
      `stationId` filters kept.
- [ ] `ReservationSummaryResponse` has no `prosumerNic`. The staff list shows and
      filters on NIC, so add it (the mock already returns it).
- [ ] No endpoint lists a station's booking slots. The create and update forms need
      one (start/end, total vs reserved positions, capacity vs reserved kWh,
      supported directions, open/closed) to populate the slot picker and show the
      remaining headroom. `getSlots(stationId)` is the placeholder.
- [ ] No endpoint lists stations for staff; `GET /api/stations/nearby` is Prosumer-only
      and needs coordinates. `getStations()` is the placeholder for a plain staff list.

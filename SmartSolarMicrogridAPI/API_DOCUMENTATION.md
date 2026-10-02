# Smart Solar Microgrid API Documentation

This document describes the currently implemented endpoints for the Smart Solar Microgrid API.

## Base URL
The API runs on `http://localhost:5014` (HTTP) or `https://localhost:7135` (HTTPS) locally.

## Response Format
All API endpoints (except for basic health checks) return responses wrapped in a standard format:
```json
{
  "success": true,
  "message": "Operation successful.",
  "data": { ... } // Response payload
}
```

---

## 1. Authentication

### 1.1 Register User
Registers a new user (Prosumer or Staff) in the system and returns a JWT token.

*   **Endpoint:** `/api/auth/register`
*   **Method:** `POST`
*   **Request Body (JSON):**

    ```json
    {
      "role": 1, // 0 for Admin, 1 for Prosumer
      "nic": "123456789V",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "0771234567",
      "password": "Password123!",
      "address": "123 Main St, Colombo",
      "solarCapacityKw": 5.5
    }
    ```

*   **Success Response (200 OK):**

    ```json
    {
      "success": true,
      "message": "Registration successful.",
      "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
        "expiresAtUtc": "2023-11-01T12:00:00Z",
        "userId": "653b6f0...",
        "fullName": "John Doe",
        "email": "john@example.com",
        "role": "Prosumer"
      }
    }
    ```

### 1.2 Login
Authenticates an existing user and returns a JWT token.

*   **Endpoint:** `/api/auth/login`
*   **Method:** `POST`
*   **Request Body (JSON):**

    ```json
    {
      "email": "john@example.com",
      "password": "Password123!"
    }
    ```

*   **Success Response (200 OK):**

    ```json
    {
      "success": true,
      "message": "Login successful.",
      "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
        "expiresAtUtc": "2023-11-01T12:00:00Z",
        "userId": "653b6f0...",
        "fullName": "John Doe",
        "email": "john@example.com",
        "role": "Prosumer"
      }
    }
    ```

---

## 2. User Management

### 2.1 Create Staff User
Allows a user with the `Backoffice` role to create internal staff members (users with either `Backoffice` or `GridOperator` roles).

*   **Endpoint:** `/api/users/staff`
*   **Method:** `POST`
*   **Authorization:** Bearer Token (Role: `Backoffice`)
*   **Request Body (JSON):**

    ```json
    {
      "role": "GridOperator", // Can be "Backoffice" or "GridOperator"
      "nic": "987654321V",
      "fullName": "Jane Smith",
      "email": "jane.smith@microgrid.com",
      "phone": "0779876543",
      "password": "SecurePassword1!",
      "address": "456 Office Rd, Colombo"
    }
    ```

*   **Success Response (200 OK):**

    ```json
    {
      "success": true,
      "message": "Staff user created successfully.",
      "data": {
        "id": "654c8e1...",
        "role": "GridOperator",
        "nic": "987654321V",
        "fullName": "Jane Smith",
        "email": "jane.smith@microgrid.com",
        "phone": "0779876543",
        "accountStatus": "Active",
        "createdAt": "2023-11-01T14:30:00Z"
      }
    }
    ```

---

## 3. Prosumer Management

### 3.1 Prosumer Self-Registration (Mobile App)
Allows a prosumer to self-register via the mobile app. Their account status will immediately be set to "Pending" awaiting Backoffice activation.

*   **Endpoint:** `/api/prosumer/register`
*   **Method:** `POST`
*   **Request Body (JSON):**

    ```json
    {
      "role": "Prosumer",
      "nic": "123456789V",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "0771234567",
      "password": "Password123!",
      "address": "123 Main St, Colombo",
      "solarCapacityKw": 5.5
    }
    ```

*   **Success Response (200 OK):** Returns the user's details and an initial JWT token (though trading actions will be forbidden until activated).

### 3.2 Backoffice Registration & Approval (Web App)
Allows the Backoffice to manually register a new prosumer. Their account status is immediately set to "Active".

*   **Endpoint:** `/api/backoffice/prosumers`
*   **Method:** `POST`
*   **Authorization:** Bearer Token (Role: `Backoffice`)
*   **Request Body (JSON):**

    ```json
    {
      "nic": "112233445V",
      "fullName": "Alice Green",
      "email": "alice@example.com",
      "phone": "0771122334",
      "password": "Password123!",
      "address": "789 Sun Rd, Kandy",
      "solarCapacityKw": 10.0
    }
    ```

*   **Success Response (200 OK):** Returns the activated prosumer's details.

### 3.3 Activate Mobile Registrations
Allows the Backoffice to activate a prosumer account that was registered via the mobile app (moving it from "Pending" to "Active").

*   **Endpoint:** `/api/backoffice/prosumers/{nic}/activate`
*   **Method:** `PUT`
*   **Authorization:** Bearer Token (Role: `Backoffice`)
*   **Request Body:** None
*   **Success Response (200 OK):** Returns the newly activated prosumer's details.

### 3.4 Prosumer Profile Update (Self-Update)
Allows prosumers to update their own profile data. The NIC is extracted securely from the JWT token.

*   **Endpoint:** `/api/prosumer/profile`
*   **Method:** `PUT`
*   **Authorization:** Bearer Token (Role: `Prosumer`)
*   **Request Body (JSON):**

    ```json
    {
      "fullName": "John Doe",
      "email": "john.new@example.com",
      "phone": "0771234567",
      "address": "456 New St, Colombo",
      "solarCapacityKw": 6.5
    }
    ```

*   **Success Response (200 OK):** Returns the updated prosumer details.

### 3.5 Backoffice Prosumer Profile Update
Allows the Backoffice to update any prosumer's profile data.

*   **Endpoint:** `/api/backoffice/prosumers/{nic}`
*   **Method:** `PUT`
*   **Authorization:** Bearer Token (Role: `Backoffice`)
*   **Request Body (JSON):** Same as `3.4 Prosumer Profile Update`.
*   **Success Response (200 OK):** Returns the updated prosumer details.

### 3.6 Prosumer Account Deactivation (Self)
Allows prosumers to request deactivation of their own account. The NIC is extracted from their JWT token.

*   **Endpoint:** `/api/prosumer/deactivate`
*   **Method:** `PUT`
*   **Authorization:** Bearer Token (Role: `Prosumer`)
*   **Request Body:** None
*   **Success Response (200 OK):** Returns the updated prosumer details with status "Deactivated".

### 3.7 Backoffice Prosumer Account Deactivation
Allows the Backoffice to immediately deactivate a prosumer's account.

*   **Endpoint:** `/api/backoffice/prosumers/{nic}/deactivate`
*   **Method:** `PUT`
*   **Authorization:** Bearer Token (Role: `Backoffice`)
*   **Request Body:** None
*   **Success Response (200 OK):** Returns the updated prosumer details with status "Deactivated".

---

## 4. Solar Station Management

All station endpoints require a Bearer token. Business rule violations return `400 Bad Request`, unknown stations/schedules return `404 Not Found`, and a wrong role returns `403 Forbidden`.

### 4.1 Register Solar Station
Registers a new solar grid hub with its GPS location, kWh capacity, number of battery storage slots (bays) and daily operating schedule. The station is created as `Active`. `stationCode` is normalized to upper case and must be unique.

*   **Endpoint:** `/api/stations`
*   **Method:** `POST`
*   **Authorization:** Bearer Token (Role: `Backoffice`)
*   **Request Body (JSON):**

    ```json
    {
      "stationName": "Colombo Central Hub",
      "stationCode": "COL-01",
      "latitude": 6.9271,
      "longitude": 79.8612,
      "addressLine": "1 Galle Road",
      "city": "Colombo",
      "capacityKwh": 500,
      "totalBays": 4,
      "operatingSchedule": "06:00-18:00"
    }
    ```

*   **Success Response (200 OK):**

    ```json
    {
      "success": true,
      "message": "Station registered successfully.",
      "data": {
        "id": "654c8e1...",
        "stationName": "Colombo Central Hub",
        "stationCode": "COL-01",
        "latitude": 6.9271,
        "longitude": 79.8612,
        "addressLine": "1 Galle Road",
        "city": "Colombo",
        "capacityKwh": 500,
        "totalBays": 4,
        "operatingSchedule": "06:00-18:00",
        "status": "Active",
        "createdAt": "2023-11-01T14:30:00Z",
        "deactivatedAt": null
      }
    }
    ```

*   **Errors:** `400` when the station code already exists or a field is invalid (e.g. latitude outside -90..90, or `operatingSchedule` not in 24-hour `HH:mm-HH:mm` format or closing before it opens).
*   `operatingSchedule` is `null` in responses for stations registered before the field existed.

### 4.2 Update Station Schedule
Lets Grid Operators and Backoffice staff replace the schedule of a booking slot at a station. All fields are required.

*   **Endpoint:** `/api/stations/{stationId}/schedules/{slotId}`
*   **Method:** `PUT`
*   **Authorization:** Bearer Token (Role: `Backoffice` or `GridOperator`)
*   **Request Body (JSON):**

    ```json
    {
      "startTime": "2026-10-01T08:00:00Z",
      "endTime": "2026-10-01T10:00:00Z",
      "totalPositions": 3,
      "status": "Available" // "Available" or "Closed"; "Full" is derived automatically
    }
    ```

*   **Business rules (each returns `400`):**
    *   The station must be `Active`.
    *   `endTime` must be after `startTime`.
    *   `totalPositions` cannot exceed the station's `totalBays`, nor be lower than the schedule's active (Pending/Approved) reservations.
    *   The time window cannot change while the schedule has active reservations, must start in the future, and cannot overlap another schedule at the same station.
    *   The status becomes `Full` automatically when active reservations fill every position, otherwise `Available` (or `Closed` if requested).

*   **Success Response (200 OK):** Returns the updated schedule (`id`, `stationId`, `startTime`, `endTime`, `totalPositions`, `status`, `updatedAt`).

### 4.3 Deactivate Station
Deactivates a station. The request is **blocked** while any energy reservation tied to the station is still active (`Pending` or `Approved`); `Rejected`, `Completed` and `Cancelled` reservations do not block.

*   **Endpoint:** `/api/stations/{stationId}/deactivate`
*   **Method:** `PUT`
*   **Authorization:** Bearer Token (Role: `Backoffice`)
*   **Request Body:** None
*   **Success Response (200 OK):** Returns the station with status `Inactive` and `deactivatedAt` set.
*   **Blocked Response (400 Bad Request):**

    ```json
    {
      "success": false,
      "message": "This station cannot be deactivated because it has 2 active energy reservation(s). Complete, cancel or reject them first.",
      "data": null
    }
    ```

### 4.4 Update Station Operating Hours
Lets Grid Operators and Backoffice staff change a station's daily operating window. This is separate from the booking slot schedules in 4.2.

*   **Endpoint:** `/api/stations/{stationId}/operating-schedule`
*   **Method:** `PUT`
*   **Authorization:** Bearer Token (Role: `Backoffice` or `GridOperator`)
*   **Request Body (JSON):**

    ```json
    {
      "operatingSchedule": "06:00-18:00"
    }
    ```

*   **Business rules (each returns `400`):**
    *   The station must be `Active`.
    *   `operatingSchedule` must be in 24-hour `HH:mm-HH:mm` format and close after it opens on the same day.

*   **Success Response (200 OK):** Returns the updated station, including `operatingSchedule`.

---
## 5. Health Checks

### 5.1 API Health
Checks if the API is running and responding.

*   **Endpoint:** `/api/health`
*   **Method:** `GET`
*   **Request Body:** None
*   **Response (200 OK):**
    ```json
    "Healthy"
    ```

### 5.2 Database Connection Status
Checks if the API is successfully connected to the MongoDB database and returns the latency.

*   **Endpoint:** `/api/health/database`
*   **Method:** `GET`
*   **Request Body:** None
*   **Success Response (200 OK):**

    ```json
    {
      "databaseConnected": true,
      "databaseName": "SmartSolarMicrogridDB",
      "responseTimeMs": 15
    }
    ```

---

## 6. QR Verification & Transfer Finalization

### 6.1 Verify Scanned QR Code
Cross-references a scanned QR code token against server reservation records and returns the booking details if valid and approved.

*   **Endpoint:** `/api/transfers/verify`
*   **Method:** `POST`
*   **Authorization:** Bearer Token (Role: `GridOperator`, `Backoffice`)
*   **Request Body (JSON):**

    ```json
    {
      "qrToken": "string"
    }
    ```

*   **Success Response (200 OK):**

    ```json
    {
      "success": true,
      "message": "QR code verified successfully.",
      "data": {
        "reservationId": "653b6f0...",
        "reservationNo": "RES-2026-0001",
        "prosumerId": "653b6e1...",
        "prosumerNic": "199812345678",
        "stationId": "653b6a2...",
        "slotId": "653b6b3...",
        "slotStartTime": "2026-10-01T08:00:00Z",
        "direction": "DropOff",
        "requestedKwh": 25.0,
        "status": "Approved",
        "qrToken": "string",
        "approvedAt": "2026-09-29T10:00:00Z"
      }
    }
    ```

*   **Error Responses:**
    *   **404 Not Found:** If no reservation matches the provided `qrToken`.
    *   **400 Bad Request:** If the reservation is not in `Approved` status (e.g., already `Completed`, `Cancelled`, or `Pending`).

### 6.2 Complete Energy Transfer
Processes the business logic to officially finalize the energy transfer and record completion details.

*   **Endpoint:** `/api/transfers/{reservationId}/complete`
*   **Method:** `POST`
*   **Authorization:** Bearer Token (Role: `GridOperator`, `Backoffice`)
*   **Request Body:** None
*   **Success Response (200 OK):**

    ```json
    {
      "success": true,
      "message": "Energy transfer completed successfully.",
      "data": {
        "reservationId": "653b6f0...",
        "reservationNo": "RES-2026-0001",
        "status": "Completed",
        "completedBy": "operator-user-id",
        "completedAt": "2026-09-29T11:30:00Z"
      }
    }
    ```

*   **Error Responses:**
    *   **404 Not Found:** If no reservation exists with the given `reservationId`.
    *   **400 Bad Request:** If the reservation is not in `Approved` status.


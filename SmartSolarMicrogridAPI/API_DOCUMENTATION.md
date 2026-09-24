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

---

## 4. Health Checks

### 4.1 API Health
Checks if the API is running and responding.

*   **Endpoint:** `/api/health`
*   **Method:** `GET`
*   **Request Body:** None
*   **Response (200 OK):**
    ```json
    "Healthy"
    ```

### 4.2 Database Connection Status
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

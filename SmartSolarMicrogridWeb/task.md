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

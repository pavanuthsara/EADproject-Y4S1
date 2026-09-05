# Smart Solar Microgrid Trading System - Project Requirements

This document extracts and organizes the requirements from `assignment-document.pdf` for SE4040 - Enterprise Application Development, Assignment 1 (2026). Page references refer to the source PDF.

## 1. Assignment overview

| Item | Requirement |
|---|---|
| Project | Smart Solar Microgrid Trading System - Client-Server Application (Web, Mobile, and Web Service) |
| Group size | Exactly four members |
| Submission deadline | 30 September 2026 at 11:59 PM |
| Module contribution | 20% of the module final mark: report 5% and source code/demo/viva 15% |
| Raw marking split | 100 marks: 35 group marks and 65 individual marks |
| Submission | One ZIP containing all project files/directories, the detailed report, and a screenshot of the application's main opening screen |
| ZIP filename | Must include the student's IT number, for example `IT15895623.zip` |
| Viva | Compulsory supervised session after submission; absence means the assignment will not be marked |
| AI assessment level | Level 2 - AI Planning |

Source: pages 1, 4-6.

## 2. System scope

Build an end-to-end client-server system with three components:

1. A web application for Backoffice staff and Grid Operators.
2. A pure native Android application for Solar Prosumers and Grid Operators.
3. A centralized C# Web API hosted on Windows IIS, backed by a NoSQL database.

The clients must act as interface layers and communicate with the central service through RESTful API calls. Business logic must reside in the API under the FAT Service pattern. Neither client may directly access the server-side database.

Source: pages 1-3 and 7-9.

## 3. User roles and access control

### 3.1 Backoffice

- Log in to the web application and be directed to the correct role-based home page.
- Access system administration functions.
- Create Backoffice and Grid Operator web users.
- Manage prosumer accounts, including reactivating deactivated accounts.
- Register and manage solar microgrid nodes and their operational schedules.
- View and action pending prosumer activations.

### 3.2 Grid Operator

- Log in to both the web and mobile applications and be directed to the appropriate role-based home screen.
- Access operational tools but not Backoffice-only administration functions.
- Update battery slot availability and monitor power-trading bookings.
- Assist with reservation cancellation.
- Scan a prosumer transaction QR code, verify it against server data, and finalize the energy-transfer job as completed.

### 3.3 Solar Prosumer

- Use the mobile application.
- Register with the National Identity Card number (NIC) as the primary key.
- Log in, edit their profile, and request account deactivation.
- Reserve, modify, and cancel energy drop-off/charging slots.
- View booking confirmation and details, active and pending bookings, booking history, and dashboard counts.
- Search or filter bookings.
- View nearby microgrid nodes on a map.
- Receive and display a secure transaction QR code after booking approval.

Source: pages 1-3 and 8-9.

## 4. Web application requirements

### 4.1 Authentication and user management

- Authenticate users through the Web API.
- Support the Backoffice and Grid Operator roles.
- Redirect each user to the correct role-based home page after login.
- Allow authorized Backoffice users to create web users.
- Restrict administration functions to Backoffice users.
- Show pending prosumer activations and allow authorized staff to act on them.

### 4.2 Prosumer management

- Create, update, and deactivate prosumer profiles.
- Use NIC as the prosumer primary key.
- Allow only a Backoffice officer to reactivate a deactivated prosumer account.

### 4.3 Microgrid node management

- Create solar grid hubs/nodes.
- Store each node's GPS location, capacity specification in kW/h as stated in the assignment, and available battery storage slots.
- Update node information and operational schedules.
- Update battery slot availability.
- Deactivate nodes only when they have no active energy reservations.
- Support the complete station lifecycle expected by the rubric. The rubric describes stations and slots as created, updated, and deleted, while the specification describes node removal as deactivation.

### 4.4 Energy slot reservation management

- Create, update, and cancel power-trading reservations through the Web API.
- Allow bookings only within the next seven days.
- Require at least 12 hours' notice for reservation updates and cancellations.
- Allow Grid Operators to monitor bookings and assist with cancellations.

### 4.5 Web user interface

- Provide a clear home/index page.
- Implement every required page and keep all pages functional.
- Make the interface responsive, polished, and consistent.
- The specification permits Bootstrap 5, Tailwind CSS, or React.js. The full-mark rubric explicitly emphasizes consistent use of Bootstrap 5 or Tailwind CSS.
- Handle API responses and errors gracefully.
- Keep business logic out of the web client.

Source: pages 1-3 and 7-8.

## 5. Android mobile application requirements

### 5.1 Technology constraints

- Build a pure native Android application.
- Do not use any cross-platform framework.
- Use a local SQLite database for local user management/persistence.
- Persist login details and reference data in SQLite.
- Communicate with the hosted Web API for all server operations.
- Do not directly access the server-side database or place central business logic in the mobile client.

### 5.2 Authentication and account management

- Provide role-aware login for Solar Prosumers and Grid Operators.
- Route each role to its correct home screen.
- Allow prosumers to create an account using NIC as the primary key.
- Allow prosumers to edit their own profile.
- Allow prosumers to request account deactivation.

### 5.3 Reservation workflow

- Allow prosumers to create booking requests.
- Allow prosumers to update booking requests.
- Allow prosumers to cancel booking requests.
- Enforce the 12-hour notice rule for updates and cancellations through the Web API.
- Enforce the seven-day booking window through the Web API.
- Display a summary page after each create, update, or cancellation action.
- Once a booking is approved, generate and display a secure transaction QR code.

### 5.4 Booking views and dashboard

- Display current bookings.
- Display pending bookings/reservations.
- Display complete booking history.
- Provide a working booking search/filter.
- Show a live count of pending reservations.
- Show a live count of approved future reservations.
- Read booking lists and dashboard counts from the API rather than using hard-coded or stale values.

### 5.5 Maps and operator workflow

- Integrate the Google Maps API.
- Plot nearby grid nodes using latitude and longitude stored on the server.
- Show station details when the user selects a map marker.
- Allow a Grid Operator to scan a prosumer's transaction QR code.
- Verify the scanned transaction against server data.
- Finalize the corresponding energy-transfer job as completed through the API.

Source: pages 2-3 and 8-9.

## 6. Web service and integration requirements

- Implement the central service as a C# Web API.
- Host the API on Windows IIS and make it reachable by both clients.
- Follow the FAT Service pattern: all validation and business logic must be in the API/service layer.
- Expose RESTful endpoints used exclusively by the web and Android clients.
- Use a stable server-side NoSQL database connection. Although the specification says a NoSQL database such as MongoDB, the marking rubric specifically expects MongoDB.
- Use the service for every operational data request from both clients.
- Prevent direct database access from both clients.
- Return useful responses and errors that both clients can handle gracefully.
- Keep API hosting and deployment steps reproducible.

Source: pages 2-3 and 7-9.

## 7. Database requirements

The full-mark rubric expects all four MongoDB collections below, with every required field, adequate sample data, and consistent references between collections:

1. `User's detail`
2. `SolarStationInfo`
3. `EnergyBookingSlots`
4. `Energy Reservation`

The data model must support at least:

- Users, roles, account status, and prosumer NIC identifiers.
- Solar station GPS coordinates, capacity, schedules, operational status, and battery slot availability.
- Energy booking slots.
- Reservations, their status, scheduled time, linked prosumer, linked node/slot, approval, QR transaction data, and completion state.
- Relationships/references between the four collections.
- Sample data added manually or through the application.

The Android SQLite database is local persistence only and does not replace the central NoSQL database.

Source: pages 2-3 and 7-9.

## 8. Business rules and validation checklist

- [ ] NIC uniquely identifies each prosumer.
- [ ] Only Backoffice can access system administration functions.
- [ ] Grid Operators receive only operational access.
- [ ] Only Backoffice can reactivate a deactivated prosumer account.
- [ ] A node cannot be deactivated while it has active energy reservations.
- [ ] A reservation must be scheduled within seven days.
- [ ] Reservation updates require at least 12 hours' notice.
- [ ] Reservation cancellations require at least 12 hours' notice.
- [ ] A transaction QR code becomes available after reservation approval.
- [ ] An operator must verify the QR transaction against live server data before completing the job.
- [ ] All central rules are enforced by the API, not by either client alone.
- [ ] Neither client directly reads from or writes to MongoDB.

## 9. Required deliverables

### 9.1 Submission ZIP

Submit one ZIP file that:

- Contains every project directory and file.
- Contains the detailed report.
- Contains a unique screenshot of the application's main opening menu/screen.
- Has a filename containing the student's IT number, for example `IT15895623.zip`.

### 9.2 Source code requirements

Code without all of the following will not be marked:

- A comment header block in every `.cs` file.
- Inline comments at the beginning of every method.
- Unique application screenshots.

Any code taken or adapted from a tutorial or another source must be referenced within the code, with a direct comment explaining its source.

### 9.3 Detailed report

The report must contain:

- Screenshots of every UI.
- An application high-level architecture diagram.
- A use case diagram.
- A data flow diagram (DFD).
- Database design.
- Source code pasted as text, not screenshots.
- All references, consistently formatted.
- Git repository link.
- A clear statement of every member's individual contribution.
- Challenges and genuine reflection.
- Reproducible hosting and deployment steps for full rubric credit.
- Design and development decisions.
- Disclosure of any AI tools used during the planning stage and a short reflection on that use.

### 9.4 README

The README must contain:

- Git repository link.
- Clearly stated individual contributions.
- A YouTube or OneDrive link to a video of no more than five minutes explaining how the application works.

### 9.5 Version control evidence

- Develop under Git/GitHub version control.
- Use meaningful, descriptive commits.
- Ensure the repository history and report provide evidence of how the work was produced.

Source: pages 4-6 and 8.

## 10. AI-use restriction

This assessment is Level 2 - AI Planning.

- AI tools may be used only during initial planning for brainstorming, outlining the solution, and preliminary domain/technology research.
- AI-generated planning material must be critically evaluated, refined, and developed further by the students.
- AI assistance must not be used for actual development or implementation of the C# Web API, native Android application, web application, or MongoDB database.
- The final system must demonstrate the students' own understanding, design decisions, technical skill, and development effort.
- Any planning-stage AI use must be disclosed in the individual contribution section of the report with a short reflection.
- Every student must be able to explain, justify, and modify their submitted code, diagrams, and documentation during the viva. Unexplainable work may receive reduced or zero individual marks.

Source: page 6.

## 11. Full-mark acceptance criteria

### 11.1 Group contribution - 35 marks

| Criterion | Marks | Full-mark target |
|---|---:|---|
| Service architecture and API design | 8 | C# API hosted on IIS, reachable by both clients, stable MongoDB connection across all endpoints, and all business logic in the API |
| Database design and data modelling | 4 | All four collections, all required fields, adequate sample data, and consistent references |
| Client build and architecture compliance | 12 | Pure native Android with SQLite; web client is a UI layer; both reliably use the hosted service and handle errors |
| UI and experience design | 6 | Polished, consistent, responsive web and Android UIs; framework used throughout; clear home page; all pages implemented |
| Documentation and deployment | 5 | Unique UI screenshots, accurate labelled diagrams, complete references, clear contributions, genuine challenges/reflection, code as text, and reproducible deployment steps |

### 11.2 Individual contribution - 65 marks

| Criterion | Marks | Full-mark target |
|---|---:|---|
| Web features and business rules | 18 | All four feature groups work through the API: role-based login, user management, microgrid node management, and reservation management with seven-day and 12-hour rules |
| Mobile authentication and accounts | 9 | Correct role routing, NIC registration, profile editing, deactivation request, and actionable pending activations in the web app |
| Reservation workflow | 9 | Create, update, and cancel through the mobile app; 12-hour rule enforced; summary shown after every action |
| Booking views and dashboard | 10 | Current/pending views, full history, working filter, and live pending/approved-future counts |
| Operator verification and maps | 7 | Server-verified QR completion workflow and live nearby stations plotted with selectable details |
| Integration, persistence, and device capabilities | 12 | All client operations use the hosted API; no direct central DB access; SQLite, Google Maps, and QR scanning fully integrated |

Source: pages 7-9.

## 12. Final submission checklist

- [ ] The group has exactly four members.
- [ ] Web, native Android, central C# Web API, IIS hosting, MongoDB, and SQLite components are complete.
- [ ] Both clients communicate exclusively with the Web API for central operations.
- [ ] All role permissions and business rules are enforced by the API.
- [ ] All required screens, maps, QR workflow, dashboards, and search/filter views work with live API data.
- [ ] Every `.cs` file has a header comment block.
- [ ] Every method begins with an inline comment.
- [ ] All borrowed/adapted code is cited in code comments.
- [ ] The report contains all required screenshots, diagrams, database design, source code text, references, repository link, contributions, challenges, decisions, deployment steps, and AI-use reflection.
- [ ] The README contains the repository link, individual contributions, and a video link of no more than five minutes.
- [ ] Git history contains meaningful, descriptive commits.
- [ ] The ZIP includes all project files, the report, and the main-screen screenshot.
- [ ] The ZIP filename contains the IT number.
- [ ] Submission is completed by 30 September 2026 at 11:59 PM.
- [ ] Every member is prepared to attend the viva and explain or modify their work.

## 13. Important interpretation notes

- The prose specification permits any NoSQL server database and gives MongoDB as an example, but the rubric explicitly awards marks for MongoDB. Use MongoDB to satisfy the marking criteria.
- React.js is listed as a web UI option in the prose specification, while the UI rubric explicitly refers to Tailwind CSS or Bootstrap 5. If React.js is used, pair it with one of those styling frameworks to align with the rubric.
- The specification uses node deactivation, while the rubric says stations and slots are created, updated, and deleted. Implement safe deactivation for nodes and confirm whether hard deletion is also expected before final submission.
- The phrase `kW/h` is reproduced from the assignment. Confirm the intended capacity/energy unit with the lecturer if it affects the data model.
- Where wording is unclear, the centralized-service rule and full-mark rubric consistently require all business logic and central data access to remain in the Web API.

# Smart Solar Microgrid API

ASP.NET Core 8 Web API for the Smart Solar Microgrid Trading System. The web and mobile clients call this API only; nothing else talks to MongoDB.

## Getting started (first time after cloning)

### 1. Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0). Check with `dotnet --version`.
- A MongoDB database and its connection string, for example a free MongoDB Atlas cluster. If you use Atlas, add your current IP address under **Network Access**, otherwise the connection will time out.
- Git Bash or any shell. Commands below work in PowerShell, Command Prompt and Bash.

### 2. Clone and restore

```bash
git clone <repo-url>
cd EADproject-Y4S1/SmartSolarMicrogridAPI
dotnet restore
```

### 3. Set your secrets

Secrets are never committed. `appsettings.json` only holds the placeholder `REPLACE_VIA_USER_SECRETS`, and each developer stores real values on their own machine with `dotnet user-secrets`. The project already has a `UserSecretsId`, so there is no `init` step. Run these from the `SmartSolarMicrogridAPI` folder.

MongoDB connection string (**required**, the API will not start without it):

```bash
dotnet user-secrets set "MongoDbSettings:ConnectionString" "<your-mongodb-connection-string>"
```

Allowed frontend origins, one command per origin (only used outside Development, where any origin is allowed):

```bash
dotnet user-secrets set "Cors:AllowedOrigins:0" "http://localhost:3000"
```

```bash
dotnet user-secrets set "Cors:AllowedOrigins:1" "http://localhost:5173"
```

JWT signing key (not used yet, needed once authentication is added). Generate a long random value, for example with Git Bash:

```bash
dotnet user-secrets set "Jwt:SecretKey" "$(openssl rand -base64 64)"
```

To see what you have stored (this prints the values, so do not share the output):

```bash
dotnet user-secrets list
```

Where the values are stored: `%APPDATA%\Microsoft\UserSecrets\<UserSecretsId>\secrets.json` on Windows, `~/.microsoft/usersecrets/<UserSecretsId>/secrets.json` on macOS and Linux. User-secrets are only loaded when `ASPNETCORE_ENVIRONMENT=Development`, which the launch profiles set for you.

### 4. Run the API

```bash
dotnet run --launch-profile https
```

For plain HTTP instead (no dev certificate needed), use `--launch-profile http`. The first time you use HTTPS, trust the development certificate:

```bash
dotnet dev-certs https --trust
```

| Profile | URL |
|---|---|
| `https` | `https://localhost:7135` (also `http://localhost:5014`) |
| `http` | `http://localhost:5014` |

On startup the console should print:

```
MongoDB connection successful. Database: SmartSolarMicrogridDB
```

If the connection fails you will see `MongoDB connection FAILED` and the app stops. See Troubleshooting below.

### 5. Check that it works

- **Swagger UI (Development only):** open `http://localhost:5014/swagger` (or `https://localhost:7135/swagger`). Expand an endpoint, click **Try it out**, then **Execute**.
- **Health check:** `GET /api/health`
- **Database connection check:** `GET /api/health/database`, which returns `databaseConnected`, `databaseName` and `responseTimeMs`, or HTTP 503 if MongoDB is unreachable.

Quick check from a terminal:

```bash
curl http://localhost:5014/api/health/database
```

Swagger is only enabled when the environment is Development. It is not available in production.

## Troubleshooting

| Problem | Cause and fix |
|---|---|
| `MongoDbSettings:ConnectionString is not configured` | The secret is missing. Run the `user-secrets set` command in step 3. |
| `MongoDB connection FAILED` or a timeout | Wrong connection string, no internet, or your IP is not allowed in Atlas Network Access. |
| Swagger shows "Unable to render this definition" | You are running an old build. Stop the API and start it again. The project pins `Microsoft.OpenApi` to 1.6.22 because newer versions produce a spec version that this Swagger UI cannot read; do not upgrade it without upgrading Swashbuckle. |
| `file is locked by SmartSolarMicrogridAPI` when building | The API is still running. Stop it, then build again. |
| Port already in use | Another instance is running on 5014 or 7135. Stop it or change the port in `Properties/launchSettings.json`. |
| Browser blocks calls from the frontend | The frontend origin is not in `Cors:AllowedOrigins`. Add it as a secret. |

## Configuration rules

No environment-specific value or secret is hard-coded in C# or committed to `appsettings.json`.

- **Secrets and environment-specific values** (`MongoDbSettings:ConnectionString`, `Cors:AllowedOrigins`, `Jwt:SecretKey`): `dotnet user-secrets` locally, environment variables when deployed, using `__` in place of `:`, for example `Cors__AllowedOrigins__0=https://app.example.com` and `MongoDbSettings__ConnectionString=...`.
- **Safe defaults** (`MongoDbSettings:DatabaseName`, `MongoDbSettings:PingTimeoutSeconds`): `appsettings.json`.
- **Ports and URLs**: `Properties/launchSettings.json` locally, the `ASPNETCORE_URLS` environment variable in production.
- **True constants** (business rules, messages, collection names): `Common/Constants/`.
- Read settings through typed classes in `Configuration/` and inject `IOptions<T>`. Do not inject `IConfiguration` into services.

## Project structure

| Folder | Contents |
|---|---|
| `Controllers/` | HTTP endpoints |
| `Services/` and `Services/Interfaces/` | Business logic |
| `Repositories/` and `Repositories/Interfaces/` | MongoDB data access |
| `Models/Entities/` | Classes mapped to MongoDB collections |
| `DTOs/Requests/`, `DTOs/Responses/` | Request and response shapes |
| `Data/` | `MongoDbContext`, collections and indexes |
| `Configuration/` | Settings classes and startup extension methods |
| `Middleware/` | Exception handling |
| `Common/` | Constants, enums, exceptions, helpers, `ApiResponse` |

## Layering rule (FAT service pattern)

Code lives in exactly one layer. **Controllers** handle routing, model binding and status codes only, with no logic. **Services** (`Services/`, each behind an interface in `Services/Interfaces/`) hold all business logic, including validation, rules, and mapping between entities and DTOs. **Repositories** (`Repositories/`, each behind an interface in `Repositories/Interfaces/`) do MongoDB CRUD only, with no business rules. Controllers call services, services call repositories, and neither controllers nor services touch `IMongoCollection` directly. Business failures are raised as `NotFoundException`, `BusinessRuleException` or `ForbiddenException` from services and translated to HTTP responses by the exception middleware.

## Adding a new feature

1. Add or reuse an entity in `Models/Entities/` and its repository interface and implementation.
2. Add the request and response DTOs.
3. Add the service interface and implementation with the business logic.
4. Register the repository and the service in `Configuration/DependencyInjectionExtensions.cs` (`AddServices()`, plus a new `AddRepositories()` when the first repository is added).
5. Add a thin controller that calls the service.

Style: inject dependencies with C# 12 primary constructors, e.g. `public class FooService(IFooRepository repo) : IFooService`. Every `.cs` file starts with the header comment block, and every method has one brief comment on top.

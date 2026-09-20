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

### 3. Create your `.env` file

Secrets and environment-specific values live in a `.env` file. It is git-ignored and never committed. Only the template `.env.example` is committed. From the `SmartSolarMicrogridAPI` folder:

```bash
cp .env.example .env
```

On Windows Command Prompt use `copy .env.example .env`. Then open `.env` and fill in your values:

| Variable | Required | Purpose |
|---|---|---|
| `MongoDbSettings__ConnectionString` | Yes | MongoDB connection string. The API will not start without it. |
| `Cors__AllowedOrigins__0`, `Cors__AllowedOrigins__1`, ... | No | Allowed frontend origins, one line per origin. Only used outside Development, where any origin is allowed. |
| `Jwt__SecretKey` | Not yet | Reserved for authentication. Generate a long random value, e.g. `openssl rand -base64 64`. |
| `MongoDbSettings__DatabaseName`, `MongoDbSettings__PingTimeoutSeconds` | No | Override the defaults from `appsettings.json`. |

Nested configuration keys use a **double underscore** instead of a colon, so `MongoDbSettings__ConnectionString` means `MongoDbSettings:ConnectionString`.

The API reads `.env` from the folder you start it in, which is the project folder when you use `dotnet run` or Visual Studio. If a variable is also set as a real environment variable, the real one wins.

#### Using `dotnet user-secrets` instead (still supported)

`.env` and `dotnet user-secrets` work side by side, and you can use either one or both. Both feed the same configuration system, so the API does not care where a value came from. Example:

```bash
dotnet user-secrets set "MongoDbSettings:ConnectionString" "<your-mongodb-connection-string>"
```

If the same key is set in both places, **`.env` wins**. Priority from lowest to highest: `appsettings.json`, `appsettings.{Environment}.json`, user-secrets (Development only), environment variables and `.env`, then command-line arguments. `dotnet user-secrets list` shows what you have stored.

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
| `MongoDbSettings__ConnectionString is not set` | The value is missing. The API validates it at startup and refuses to run without it. Set it in `.env` (see step 3) or use `dotnet user-secrets`. |
| `.env` values seem to be ignored | The file must be named exactly `.env` and sit in the folder you run from (`SmartSolarMicrogridAPI`). A real environment variable with the same name overrides it. Names need `__`, not `:`. |
| `MongoDB connection FAILED` or a timeout | Wrong connection string, no internet, or your IP is not allowed in Atlas Network Access. |
| Swagger shows "Unable to render this definition" | You are running an old build. Stop the API and start it again. The project pins `Microsoft.OpenApi` to 1.6.22 because newer versions produce a spec version that this Swagger UI cannot read; do not upgrade it without upgrading Swashbuckle. |
| `file is locked by SmartSolarMicrogridAPI` when building | The API is still running. Stop it, then build again. |
| Port already in use | Another instance is running on 5014 or 7135. Stop it or change the port in `Properties/launchSettings.json`. |
| Browser blocks calls from the frontend | The frontend origin is not in `Cors__AllowedOrigins__N`. Add it to `.env`. |

## Configuration rules

No environment-specific value or secret is hard-coded in C# or committed to `appsettings.json`.

- **Secrets and environment-specific values** (`MongoDbSettings:ConnectionString`, `Cors:AllowedOrigins`, `Jwt:SecretKey`): the local `.env` file (or `dotnet user-secrets`) during development, real environment variables when deployed, using `__` in place of `:`, for example `Cors__AllowedOrigins__0=https://app.example.com`. Do not ship a `.env` file to servers.
- **Safe defaults** (`MongoDbSettings:DatabaseName`, `MongoDbSettings:PingTimeoutSeconds`): `appsettings.json`.
- **Ports and URLs**: `Properties/launchSettings.json` locally, the `ASPNETCORE_URLS` environment variable in production.
- **True constants** (business rules, messages, collection names): `Common/Constants/`.
- Read settings through typed classes in `Configuration/` and inject `IOptions<T>`. Do not inject `IConfiguration` into services.
- When you add a new setting, add it to `.env.example` too so teammates know it exists. Never put a real value in `.env.example`.

## Project structure

| Folder | Contents |
|---|---|
| `Controllers/` | HTTP endpoints |
| `Services/` and `Services/Interfaces/` | Business logic |
| `Repositories/` and `Repositories/Interfaces/` | MongoDB data access |
| `Models/Entities/` | Classes mapped to MongoDB collections |
| `DTOs/Requests/`, `DTOs/Responses/` | Request and response shapes |
| `Data/` | `MongoDbContext`, collections and indexes |
| `Configuration/` | Settings classes and startup extension methods, including `.env` loading |
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

Style: inject dependencies with C# 12 primary constructors, e.g. `public class FooService(IFooRepository repo) : IFooService`. Every `.cs` file starts with a header comment block (File, Author with registration number, Group, Description, Individual Contribution), and every method has one brief comment on top.

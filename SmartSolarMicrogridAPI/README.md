# Smart Solar Microgrid API

ASP.NET Core 8 Web API backing the web and mobile clients of the Smart Solar Microgrid Trading System. Clients call this API only; nothing else talks to MongoDB.

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- A MongoDB instance (local or Atlas) and its connection string

## Configure the connection string

`appsettings.json` holds a placeholder. Set the real value with user-secrets (never commit it):

```bash
cd SmartSolarMicrogridAPI
dotnet user-secrets set "MongoDbSettings:ConnectionString" "<your-mongodb-connection-string>"
```

The API refuses to start while the placeholder is still in place.

## Run

```bash
dotnet run --launch-profile https
```

- Base URL: `https://localhost:7135` (HTTP: `http://localhost:5014`)
- Swagger UI (Development only): `https://localhost:7135/swagger`
- Health check: `GET /api/health`

## Layering rule (FAT service pattern)

Code lives in exactly one layer. **Controllers** handle routing, model binding and status codes only, with no logic. **Services** (`Services/`, each behind an interface in `Services/Interfaces/`) hold all business logic, including validation, rules, and mapping between entities and DTOs. **Repositories** (`Repositories/`, each behind an interface in `Repositories/Interfaces/`) do MongoDB CRUD only, with no business rules. Controllers call services, services call repositories, and neither controllers nor services touch `IMongoCollection` directly. Business failures are raised as `NotFoundException`, `BusinessRuleException` or `ForbiddenException` from services and translated to HTTP responses by the exception middleware.

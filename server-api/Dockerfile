# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy the solution file and project files relative to the build context
COPY ["server-api/IKPhones.sln", "./"]
COPY ["server-api/IKPhones.Api/IKPhones.Api.csproj", "IKPhones.Api/"]
COPY ["server-api/IKPhones.Application/IKPhones.Application.csproj", "IKPhones.Application/"]
COPY ["server-api/IKPhones.Core/IKPhones.Core.csproj", "IKPhones.Core/"]
COPY ["server-api/IKPhones.Infrastructure/IKPhones.Infrastructure.csproj", "IKPhones.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "IKPhones.Api/IKPhones.Api.csproj"

# Copy everything else over
COPY server-api/ ./server-api/
WORKDIR /src/server-api/IKPhones.Api

# Build and publish
RUN dotnet publish "IKPhones.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Bind port for Render
ENV ASPNETCORE_URLS=http://0.0.0.0:${PORT:-8080}

ENTRYPOINT ["dotnet", "IKPhones.Api.dll"]
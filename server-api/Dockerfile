# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY IKPhones.sln ./
COPY IKPhones.Api/*.csproj ./IKPhones.Api/
COPY IKPhones.Application/*.csproj ./IKPhones.Application/
COPY IKPhones.Core/*.csproj ./IKPhones.Core/
COPY IKPhones.Infrastructure/*.csproj ./IKPhones.Infrastructure/

# Restore dependencies
RUN dotnet restore IKPhones.sln

# Copy the entire backend directory contents
COPY . .
WORKDIR /src/IKPhones.Api
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "IKPhones.Api.dll"]
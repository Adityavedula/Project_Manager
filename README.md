# Project Manager

A Spring Boot-based Project Management System with JWT authentication and SQLite database.

## Technologies

- Java 17
- Spring Boot 3.2.5
- Spring Security with JWT
- SQLite database
- JPA/Hibernate
- Maven

## Prerequisites

- Java 17 or higher
- Maven (or use included Maven wrapper)

## Running the Application

### Using Maven wrapper:

```bash
# Windows
./mvnw.cmd spring-boot:run

# Linux/Mac
./mvnw spring-boot:run
```

### Using Java:

```bash
java -jar target/projectmanager-0.0.1-SNAPSHOT.jar
```

### Environment Variables:

- `JWT_SECRET` - Secret key for JWT tokens (default: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970)
- `JWT_EXPIRATION` - JWT token expiration in milliseconds (default: 86400000)
- `PORT` - Server port (default: 8080)

## Database

Uses SQLite with database file `projectmanager.db` created in the working directory.

## API Endpoints

The application provides REST API endpoints for project management with JWT-based authentication.

## Building for Production

```bash
./mvnw.cmd clean package -DskipTests
```

The JAR file will be created in the `target/` directory.

## Docker Deployment

See [Dockerfile](Dockerfile) and use:

```bash
docker build -t projectmanager .
docker run -p 8080:8080 -v $(pwd)/data:/app/data projectmanager
```

# Project Manager

A Spring Boot-based Project Management System with JWT authentication and SQLite database.

## Technologies

- Java 17
- Spring Boot 3.2.5
- Spring Security with JWT
- SQLite database
- JPA/Hibernate
- Maven

## Key Features

- **Task Creation**: Create project tasks with details like title, description, due dates, and priority levels.
- **Task Assignment**: Assign tasks to team members with clear ownership tracking.
- **Status Tracking**: Monitor task progress through customizable statuses (e.g., To Do, In Progress, Done).
- JWT-based secure authentication and authorization.
- Lightweight SQLite database for persistent storage.
- RESTful API for seamless integration.

## Data Model & Validations

### JPA Entity Relationships

The application uses three core JPA entities with the following relationships:

- **User** (`com.example.projectmanager.model.User`)
  - Represents application users with roles (`ADMIN`, `MEMBER`)
  - Implements `UserDetails` for Spring Security integration
  - Fields: `id` (auto-generated), `email` (unique), `password`, `fullName`, `role`
  - Referenced by other entities as:
    - `Project.owner` (ManyToOne)
    - `Project.members` (ManyToMany)
    - `Task.assignedTo` (ManyToOne)

- **Project** (`com.example.projectmanager.model.Project`)
  - Represents a project with `name` and `description`
  - Relationships:
    - `@ManyToOne` to `User` (owner) via `owner_id` column
    - `@ManyToMany` to `User` (members) via join table `project_members` (columns: `project_id`, `user_id`)
    - `@OneToMany` to `Task` (tasks) mapped by `Task.project` field, with `cascade = CascadeType.ALL` and `orphanRemoval = true`

- **Task** (`com.example.projectmanager.model.Task`)
  - Represents a task with `title`, `description`, `status`, `dueDate`
  - Status enum values: `TODO`, `IN_PROGRESS`, `COMPLETED`, `OVERDUE`
  - Relationships:
    - `@ManyToOne` to `Project` (project) via `project_id` column
    - `@ManyToOne` to `User` (assignedTo) via `assigned_to_id` column

### Validation Rules

Validations are applied at entity and DTO levels, with request bodies validated using `@Valid` in controllers:

- **Entity-level**:
  - `User.email`: Unique constraint via `@Column(unique = true)`

- **DTO-level (request validation)**:
  - `RegisterRequest`:
    - `fullName`: `@NotBlank` (required)
    - `email`: `@NotBlank` + `@Email` (valid format, required)
    - `password`: `@NotBlank` + `@Size(min = 6)` (minimum 6 characters)
  - `AuthenticationRequest`:
    - `email`: `@NotBlank` + `@Email`
    - `password`: `@NotBlank`
  - `ProjectRequest`:
    - `name`: `@NotBlank` (required)
  - `TaskRequest`:
    - `title`: `@NotBlank` (required)
    - `assigneeEmail`: `@NotBlank` + `@Email` (valid assignee email, required)

## Role-Based Access Control (RBAC)

The application implements role-based access control with two roles: **ADMIN** and **MEMBER**.

### Role Definitions

| Role | Description |
|------|-------------|
| `ADMIN` | Full system access. Can create, update, and delete any project. Default role assignment during registration can be specified. |
| `MEMBER` | Standard user. Can view all projects and tasks, update only projects they own. Cannot create or delete projects. |

### Access Rules

- **Default role**: New users are assigned `MEMBER` role by default on registration (`RegisterRequest`).
- **Project creation**: Restricted to `ADMIN` users only (`ProjectService.createProject`).
- **Project update**: Allowed for `ADMIN` users or the project `owner` (`ProjectService.updateProject`).
- **Project deletion**: Restricted to `ADMIN` users only (`ProjectService.deleteProject`).
- **Project/Tasks viewing**: All authenticated users can view projects and tasks.
- **Task operations**: Authorization is enforced at the service layer based on project membership and ownership.
- **Frontend**: UI elements (e.g., create/delete project buttons) are conditionally rendered based on the user's role via `app.js` and `project.js`.

### Security Implementation

- JWT tokens include the user's role in the `GrantedAuthority` (e.g., `ROLE_ADMIN`, `ROLE_MEMBER`).
- Spring Security is configured as stateless; all API requests (except auth endpoints) require a valid JWT.
- Role checks are performed at the service layer using `SecurityContextHolder` to retrieve the authenticated user and their role.

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

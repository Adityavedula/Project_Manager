# How to Run the Project Manager Application

## Prerequisites

- **Java 17** (required) - [Eclipse Temurin JDK](https://adoptium.net/)
- **Maven 3.8+** (optional, if you want to rebuild)

### Check Java Version

```bash
java -version
```

Must show Java 17.x. If you have multiple Java versions, ensure Java 17 is first in your PATH.

## Quick Start (Already Built)

The application is already compiled. Just run:

### Windows (PowerShell)
```powershell
$env:PATH = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
java -jar target/projectmanager-0.0.1-SNAPSHOT.jar
```

### Linux/macOS
```bash
java -jar target/projectmanager-0.0.1-SNAPSHOT.jar
```

## Rebuild from Source

If you make changes to the code:

### Windows (PowerShell)
```powershell
$env:PATH = "C:\tools\maven\apache-maven-3.9.6\bin;" + [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
mvn package -DskipTests
java -jar target/projectmanager-0.0.1-SNAPSHOT.jar
```

### Linux/macOS
```bash
mvn package -DskipTests
java -jar target/projectmanager-0.0.1-SNAPSHOT.jar
```

## Access the Application

Once started, open your browser to:

- **Login/Register**: http://localhost:8080
- **Dashboard**: http://localhost:8080/dashboard.html
- **API Base**: http://localhost:8080/api/v1

The server runs on **port 8080** by default. Change it by setting the `PORT` environment variable:

```bash
java -Dserver.port=3000 -jar target/projectmanager-0.0.1-SNAPSHOT.jar
```

## Default Admin Account

If you need to create an admin account, register with a new email/password — the first registered user becomes admin.

## Stop the Application

Press `Ctrl+C` in the terminal where the app is running.

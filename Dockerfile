FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY target/projectmanager-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENV JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
ENV JWT_EXPIRATION=86400000
ENV PORT=8080

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

ENTRYPOINT ["java", "-jar", "app.jar"]

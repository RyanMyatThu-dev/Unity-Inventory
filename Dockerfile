FROM postgres:17-alpine

# Set environment variables for the database
ENV POSTGRES_DB=IMS_DB
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=sasa@123

# Copy the database initialization script
COPY dbscript.sql /docker-entrypoint-initdb.d/

# Expose PostgreSQL port
EXPOSE 5432
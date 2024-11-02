# Use the official PostgreSQL image
FROM postgres:latest

# Set environment variables for PostgreSQL
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=root
ENV POSTGRES_DB=recipesDb

# Copy the database dump into the container's initialization directory
COPY recipes.sql /docker-entrypoint-initdb.d/

# Expose PostgreSQL port
EXPOSE 5432

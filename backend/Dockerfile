# # Backend Dockerfile
# FROM python:3.11-slim

# WORKDIR /app

# # Install system dependencies including compilers for code execution
# RUN apt-get update && apt-get install -y \
#     gcc \
#     g++ \
#     default-jdk \
#     nodejs \
#     npm \
#     libffi-dev \
#     && rm -rf /var/lib/apt/lists/*

# # Copy requirements first for caching
# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt

# # Copy application code
# COPY . .

# # Create non-root user
# RUN adduser --disabled-password --gecos '' appuser
# USER appuser

# # Expose port
# EXPOSE 8000

# # Start command
# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]


# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies including compilers and libraries
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    build-essential \
    default-jdk \
    nodejs \
    npm \
    libffi-dev \
    libssl-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip FIRST (critical fix)
RUN pip install --upgrade pip setuptools wheel

# Copy requirements first for caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser

# Give permissions to app folder
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Start command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
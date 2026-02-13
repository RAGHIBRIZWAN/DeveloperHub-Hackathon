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

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    build-essential \
    ffmpeg \
    curl \
    git \
    libffi-dev \
    libssl-dev \
    python3-dev \
    default-jdk \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install Rust (required for whisper)
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Upgrade pip
RUN pip install --upgrade pip setuptools wheel

# Copy requirements
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy code
COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
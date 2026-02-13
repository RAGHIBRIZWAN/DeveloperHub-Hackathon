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

FROM python:3.11

WORKDIR /app

# Install system dependencies required for whisper, torch, and builds
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    build-essential \
    ffmpeg \
    git \
    curl \
    libffi-dev \
    libssl-dev \
    python3-dev \
    default-jdk \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and build tools FIRST (critical)
RUN pip install --upgrade pip setuptools wheel

# Install torch FIRST (whisper dependency)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Copy requirements
COPY requirements.txt .

# Install requirements (DO NOT include openai-whisper here)
RUN pip install --no-cache-dir --no-build-isolation -r requirements.txt

# Install whisper separately (prevents metadata build crash)
RUN pip install --no-cache-dir openai-whisper

# Copy application code
COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
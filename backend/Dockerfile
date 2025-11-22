FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /project

RUN apt-get update && apt-get install -y \
    python3-dev default-libmysqlclient-dev build-essential pkg-config\
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

# Create and set up entrypoint script
RUN printf '#!/bin/sh\nset -e\necho "Running Django setup..."\npython manage.py collectstatic --noinput\npython manage.py migrate\necho "Starting server..."\nexec "$@"\n' > /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["gunicorn", "project.wsgi:application", "-b", "0.0.0.0:9000", "--workers", "4"]

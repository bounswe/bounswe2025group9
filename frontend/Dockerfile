FROM node:20-slim AS build

WORKDIR /app
COPY package.json ./
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine

ARG BUILD=DEV

COPY --from=build /app/dist /usr/share/nginx/html

RUN mkdir -p /etc/nginx/certs

COPY nginx-dev.conf /tmp/nginx-dev.conf
COPY nginx.conf /tmp/nginx.conf

RUN if [ "$BUILD" = "PROD" ]; then \
        cp /tmp/nginx.conf /etc/nginx/conf.d/default.conf; \
    else \
        cp /tmp/nginx-dev.conf /etc/nginx/conf.d/default.conf; \
    fi && rm /tmp/nginx*.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]

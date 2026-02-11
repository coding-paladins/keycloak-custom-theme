ARG KEYCLOAK_VERSION=26.5.3

# Stage 1: Build Keycloak theme JAR
FROM node:20-alpine AS keycloakify_jar_builder

# Install JDK and Maven
RUN apk update && \
    apk add --no-cache openjdk17-jdk maven

# Install dependencies first for better layer caching
WORKDIR /opt/app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source, run postinstall (keycloakify sync-extensions), then build
COPY . .
RUN pnpm run postinstall
RUN pnpm build-keycloak-theme

# Select the theme JAR matching Keycloak version and copy to a fixed path.
# Multiple JARs use different parent themes (e.g. 21-and-below uses parent=keycloak);
# Keycloak 26.x lacks the keycloak theme - the 26.2-and-above JAR correctly uses parent=account-v1.
ARG KEYCLOAK_VERSION
RUN set -e && \
    MAJOR=$(echo "${KEYCLOAK_VERSION}" | cut -d. -f1) && \
    MINOR=$(echo "${KEYCLOAK_VERSION}" | cut -d. -f2) && \
    if [ "${MAJOR}" -le 21 ]; then \
        cp /opt/app/dist_keycloak/keycloak-theme-for-kc-21-and-below.jar /opt/app/dist_keycloak/theme.jar; \
    elif [ "${MAJOR}" -eq 23 ]; then \
        cp /opt/app/dist_keycloak/keycloak-theme-for-kc-23.jar /opt/app/dist_keycloak/theme.jar; \
    elif [ "${MAJOR}" -eq 24 ]; then \
        cp /opt/app/dist_keycloak/keycloak-theme-for-kc-24.jar /opt/app/dist_keycloak/theme.jar; \
    elif [ "${MAJOR}" -eq 25 ]; then \
        cp /opt/app/dist_keycloak/keycloak-theme-for-kc-25.jar /opt/app/dist_keycloak/theme.jar; \
    elif [ "${MAJOR}" -eq 26 ] && [ "${MINOR}" -le 1 ]; then \
        cp /opt/app/dist_keycloak/keycloak-theme-for-kc-26.0-to-26.1.jar /opt/app/dist_keycloak/theme.jar; \
    else \
        cp /opt/app/dist_keycloak/keycloak-theme-for-kc-26.2-and-above.jar /opt/app/dist_keycloak/theme.jar; \
    fi

# Stage 2: Build Keycloak server with the theme
FROM quay.io/keycloak/keycloak:${KEYCLOAK_VERSION} AS builder

COPY --from=keycloakify_jar_builder /opt/app/dist_keycloak/theme.jar /opt/keycloak/providers/

# Configure the database vendor and enable health and metrics endpoints.
ENV KC_DB=postgres
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true

# For demonstration purposes only. Use signed certificates in production!
WORKDIR /opt/keycloak

# Create the optimized configuration
RUN /opt/keycloak/bin/kc.sh build

# Defines the runtime container image
FROM quay.io/keycloak/keycloak:${KEYCLOAK_VERSION}

# Copy the configuration files from the builder image to this runtime image
COPY --from=builder /opt/keycloak/ /opt/keycloak/

# Set default values db pool/configs
ENV KC_DB=postgres
ENV KC_DB_POOL_INITIAL_SIZE=50
ENV KC_DB_POOL_MIN_SIZE=50
ENV KC_DB_POOL_MAX_SIZE=50
ENV QUARKUS_TRANSACTION_MANAGER_ENABLE_RECOVERY=true

# Default hostname value. This should be updated when deployed.
ENV KC_HOSTNAME="localhost"

# Default to enable listening on HTTP, and accept edge TLS termination. In
# other words we trust the load balancer in front of keycloak.
ENV KC_HTTP_ENABLED=true
ENV KC_PROXY=edge

# Use recommended production entrypoint
ENTRYPOINT ["/opt/keycloak/bin/kc.sh", "start"]

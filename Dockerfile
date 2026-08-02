# syntax=docker/dockerfile:1.7
# ---- builder ---------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# The build prerenders one HTML file per destination per language, and it reads
# the destination list from the live API — a list checked into the repository
# would be wrong the first time someone adds a country in the admin. So this
# stage needs network access. If the API cannot be reached the build still
# succeeds and logs a warning; only the destination pages go unbaked, and they
# fall back to client rendering until the next deploy.
#
# Point this at a staging API to build a staging image against its catalogue.
ARG PRERENDER_API_BASE=https://qulaysim.uz/api
ENV PRERENDER_API_BASE=$PRERENDER_API_BASE
RUN npm run build

# ---- runtime ---------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

COPY --from=builder /build/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-security-headers.conf /etc/nginx/snippets/security-headers.conf

# nginx:alpine ships an unprivileged `nginx` user; port 8080 so it can bind
# without root.
RUN touch /var/run/nginx.pid \
 && chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /usr/share/nginx/html

USER nginx
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]

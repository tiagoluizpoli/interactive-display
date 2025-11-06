# Stage 1: Build the React application
FROM node:20-slim AS build
WORKDIR /app/apps/frontend
COPY apps/frontend/package.json ./package.json
COPY apps/frontend/yarn.lock ./yarn.lock
COPY apps/frontend/ ./
RUN yarn install --frozen-lockfile
RUN yarn build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
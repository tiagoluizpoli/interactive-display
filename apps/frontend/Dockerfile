# Stage 1: Build the React application
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
COPY apps/frontend/package.json apps/frontend/yarn.lock ./apps/frontend/
RUN yarn install --frozen-lockfile
COPY apps/frontend/ ./apps/frontend/
WORKDIR /app/apps/frontend
RUN yarn global add typescript
RUN yarn build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
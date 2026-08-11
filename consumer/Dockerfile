FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY core/package.json core/package.json
COPY react/package.json react/package.json
COPY react-native/package.json react-native/package.json
COPY webhooks/package.json webhooks/package.json
COPY library/package.json library/package.json
COPY consumer/package.json consumer/package.json

RUN npm ci

COPY . .

RUN npm run build --workspace @airix/video-core \
  && npm run build --workspace @airix/video-react \
  && npm run build --workspace consumer

FROM nginx:1.27-alpine

COPY consumer/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/consumer/dist /usr/share/nginx/html

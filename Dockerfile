FROM fullpipe/node:lts AS build

WORKDIR /app

COPY package* .
RUN npm ci
COPY . .
RUN npm run build

FROM fullpipe/web-app:latest AS release
COPY --from=build /app/dist/ng-test/browser /app

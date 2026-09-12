FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /lecode-backend ./cmd/api

FROM alpine:latest
RUN apk --no-cache add ca-certificates curl
WORKDIR /app
RUN mkdir -p uploads
COPY --from=builder /lecode-backend /app/lecode-backend
EXPOSE 8082
ENTRYPOINT ["/app/lecode-backend"]

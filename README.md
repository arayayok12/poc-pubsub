# Kafka Pub/Sub POC

Real-time messaging proof-of-concept using Kafka pub/sub pattern with WebSockets.

## Architecture

```
                    ┌─────────────────┐
                    │     Kafka       │
                    │ (Topic: messages)│
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  All-in-One     │
                    │  (Express +     │
                    │   Socket.IO)    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Web Browser    │
                    │  (Real-time UI) │
                    └─────────────────┘
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Web UI | 3003 | Browser UI for testing |
| App | 3000 | All-in-one service (Express + Socket.IO + Kafka) |
| Kafka | 9092 | Message broker (KRaft mode) |
| Kafka UI | 9090 | Web UI for Kafka management |

## Quick Start

```bash
# Start all services
docker compose up -d --build --remove-orphans

# Open browser to
http://localhost:3003
```

## Testing

1. Open http://localhost:3003 in one or more browser tabs
2. Type a message and click Send
3. Watch the message appear in real-time across all connected clients
4. Check Kafka UI at http://localhost:9090 to see messages in the `messages` topic

## API Endpoints

- `POST /message` - Send a message to Kafka
  ```json
  {"message": "Hello", "sender": "User"}
  ```

- `GET /health` - Health check

## Stopping

```bash
docker compose down
```

## Tech Stack

- **Kafka**: Apache Kafka 3.7.0 (KRaft mode - no Zookeeper)
- **Express**: Web server framework
- **Socket.IO**: WebSocket library
- **TypeScript**: Type-safe JavaScript
- **Docker Compose**: Container orchestration

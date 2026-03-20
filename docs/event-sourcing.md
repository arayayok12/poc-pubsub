# Event Sourcing with Kafka

## What is Event Sourcing?

Event sourcing is a pattern where you store **all changes to application state** as a sequence of events, rather than just storing the current state.

### Traditional vs Event Sourcing

```
Traditional Database:
┌─────────────────┐
│ Current State   │  User: John, Balance: $100
│ (only what is)  │
└─────────────────┘

Event Sourcing:
┌─────────────────────────────────────┐
│ Event Stream (history of everything)│
│ 1. AccountCreated {user: "John"}    │
│ 2. Deposit {amount: 50}             │
│ 3. Deposit {amount: 50}             │
│ 4. Withdraw {amount: 25}            │
│ → Current State can be rebuilt      │
└─────────────────────────────────────┘
```

## Real-World Examples

### 1. Banking System

```typescript
// Events stored in Kafka
{
  eventType: "AccountOpened",
  accountId: "acc-123",
  owner: "John Doe",
  timestamp: "2024-01-15T10:00:00Z"
}
{
  eventType: "MoneyDeposited",
  accountId: "acc-123",
  amount: 100.00,
  timestamp: "2024-01-15T10:05:00Z"
}
{
  eventType: "MoneyWithdrawn",
  accountId: "acc-123",
  amount: 25.00,
  timestamp: "2024-01-15T10:10:00Z"
}

// Rebuild current state by replaying events:
// Balance = 0 + 100 - 25 = $75
```

**Benefits:**
- Complete audit trail
- Can replay events to recreate any point in time
- Detect fraud by analyzing patterns

### 2. E-Commerce Order System

```typescript
// Topic: orders-events
{
  eventType: "OrderCreated",
  orderId: "ORD-456",
  customerId: "CUST-789",
  items: [{productId: "SKU-001", quantity: 2}],
  total: 49.98
}
{
  eventType: "PaymentAuthorized",
  orderId: "ORD-456",
  paymentMethod: "visa_1234",
  amount: 49.98
}
{
  eventType: "OrderShipped",
  orderId: "ORD-456",
  trackingNumber: "1Z999AA1",
  carrier: "UPS"
}
{
  eventType: "OrderDelivered",
  orderId: "ORD-456",
  deliveredAt: "2024-01-16T14:30:00Z"
}
```

**Multiple services consume these events:**
- **Inventory Service** - Updates stock levels
- **Shipping Service** - Creates shipping labels
- **Notification Service** - Sends emails to customer
- **Analytics Service** - Tracks conversion rates

### 3. User Activity Tracking (Audit Log)

```typescript
// Topic: user-activity-events
{
  eventType: "UserLoggedIn",
  userId: "user-123",
  ip: "192.168.1.1",
  device: "Chrome / Windows",
  timestamp: "2024-01-15T09:00:00Z"
}
{
  eventType: "ProfileUpdated",
  userId: "user-123",
  changes: {field: "email", old: "old@email.com", new: "new@email.com"},
  timestamp: "2024-01-15T09:15:00Z"
}
{
  eventType: "PasswordChanged",
  userId: "user-123",
  timestamp: "2024-01-15T09:20:00Z"
}
```

**Use cases:**
- Security investigations
- Compliance requirements (SOC2, GDPR)
- User behavior analytics

### 4. IoT / Sensor Data

```typescript
// Topic: sensor-events
{
  deviceId: "temp-sensor-01",
  location: "Warehouse A",
  temperature: 22.5,
  humidity: 45,
  timestamp: "2024-01-15T10:00:00Z"
}
{
  deviceId: "temp-sensor-01",
  location: "Warehouse A",
  temperature: 23.1,
  humidity: 47,
  timestamp: "2024-01-15T10:01:00Z"
}
```

**Consumers:**
- **Alert Service** - Detect anomalies (temp > 30°C)
- **Analytics Service** - Temperature trends over time
- **Reporting Service** - Daily averages

### 5. Database Change Data Capture (CDC)

```typescript
// Topic: mysql.customers.events
{
  op: "c",  // create
  before: null,
  after: {id: 1, name: "John", email: "john@example.com"},
  ts_ms: 1705300800000
}
{
  op: "u",  // update
  before: {id: 1, name: "John", email: "john@example.com"},
  after: {id: 1, name: "John", email: "newemail@example.com"},
  ts_ms: 1705300900000
}
{
  op: "d",  // delete
  before: {id: 1, name: "John", email: "newemail@example.com"},
  after: null,
  ts_ms: 1705301000000
}
```

**Use cases:**
- Sync databases (MySQL → PostgreSQL)
- Update search index (MySQL → Elasticsearch)
- Cache invalidation (MySQL → Redis)

## Event Sourcing Pattern

```
┌──────────┐     ┌─────────────┐     ┌──────────────────┐
│Command  │────▶│ Event Store │────▶│   Event Handlers │
│(Action) │     │   (Kafka)   │     │  (Projections)   │
└──────────┘     └─────────────┘     └──────────────────┘
                     │
                     │ Replay events
                     ▼
              ┌──────────────┐
              │ Read Models  │
              │ (Views)      │
              └──────────────┘
```

## Benefits

| Benefit | Description |
|---------|-------------|
| **Audit Trail** | Every change is recorded with timestamp |
| **Temporal Queries** | "What was the state yesterday?" |
| **Debugging** | Replay events to reproduce issues |
| **Decoupling** | Producers don't know about consumers |
| **Scalability** | Add new consumers without modifying producers |

## Trade-offs

| Consideration | Notes |
|---------------|-------|
| **Event Schema Changes** | Need versioning strategy |
| **Storage** | More data than storing just current state |
| **Complexity** | Need to handle out-of-order events, duplicates |
| **Event Versioning** | Multiple consumers may need different formats |

## When to Use Event Sourcing

✅ **Good for:**
- Financial systems (transactions)
- Audit and compliance requirements
- Complex business workflows
- Systems with multiple read models
- Microservices communication

❌ **Not ideal for:**
- Simple CRUD applications
- Low-volume systems where overhead isn't justified
- When queries need only current state (no history needed)

## Kafka Topic Naming

Good naming conventions for events:

```
# Domain events
{domain}.events
  → orders.events
  → payments.events
  → customers.events

# Specific event types
{domain}.{entity}.{event-type}
  → orders.order.created
  → orders.order.shipped
  → customers.customer.updated

# CDC (Change Data Capture)
{database}.{table}
  → mysql.customers
  → postgresql.orders
```

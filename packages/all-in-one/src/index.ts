import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { Kafka } from 'kafkajs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Get Kafka configuration
const kafkaBrokers = process.env.KAFKA_BROKERS || 'localhost:9092';
console.log('=== KAFKA PUB/SUB POC ===');
console.log('KAFKA_BROKERS:', process.env.KAFKA_BROKERS);
console.log('Using brokers:', kafkaBrokers);

// Create Kafka client (use separate instances for producer and consumer)
const producerKafka = new Kafka({
  brokers: [kafkaBrokers],
  clientId: 'producer-service',
});

const consumerKafka = new Kafka({
  brokers: [kafkaBrokers],
  clientId: 'consumer-service',
});

const producer = producerKafka.producer();
const consumer = consumerKafka.consumer({ groupId: 'websocket-group' });
const TOPIC = 'messages';

// Broadcast function for messages
function broadcastMessage(data: any) {
  io.emit('message', data);
}

// Retry helper
async function retry<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
  delayMs = 3000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isLast = i === maxRetries - 1;
      if (isLast) throw error;
      console.log(`  Attempt ${i + 1}/${maxRetries} failed, retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('Retry failed');
}

// Connect producer
console.log('\n=== STARTING SERVICES ===');
console.log('Connecting producer...');
await producer.connect();
console.log('✓ Producer connected!');

// Connect consumer with retry
console.log('Connecting consumer...');
await retry(async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC, fromBeginning: false });
}, 10, 5000);
console.log('✓ Consumer connected!');

// Start consuming messages
await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const value = message.value?.toString();
    if (value) {
      try {
        const data = JSON.parse(value);
        console.log(`📨 Received from Kafka [${topic}/${partition}]: [${data.sender}] ${data.message}`);
        broadcastMessage(data);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    }
  },
}).catch((error: unknown) => {
  console.error('❌ Consumer error:', error);
});

// POST endpoint to send messages
app.post('/message', async (req, res) => {
  const { message, sender = 'anonymous' } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const timestamp = new Date().toISOString();
    const payload = {
      topic: TOPIC,
      messages: [
        {
          key: sender,
          value: JSON.stringify({ message, sender, timestamp }),
        },
      ],
    };

    await producer.send(payload);

    res.json({ success: true, message: 'Message sent to Kafka' });
  } catch (error) {
    console.error('Error sending to Kafka:', error);
    res.status(500).json({ error: 'Failed to send message', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'kafka-pub-sub-poc' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log('\n=== SERVICE READY ===');
  console.log(`Web UI: http://localhost:${PORT}`);
  console.log(`Kafka UI: http://localhost:9090`);
  console.log('=====================\n');
});

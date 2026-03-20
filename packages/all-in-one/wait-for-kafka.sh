#!/bin/sh
# Wait for Kafka to be ready
echo "Waiting for Kafka to be ready..."
# First wait for TCP port
until nc -z kafka 9092; do
  echo "Kafka port not ready yet, waiting..."
  sleep 2
done
echo "Kafka port is open, waiting for broker to be fully ready..."
# Wait additional time for Kafka to fully initialize (KRaft mode needs more time for group coordinator)
sleep 30
echo "Kafka should be ready!"
exec "$@"

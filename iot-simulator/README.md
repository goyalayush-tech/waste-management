# IoT Simulator

Run local MQTT broker and simulators via Docker Compose:

```bash
# Dev
docker-compose -f docker-compose.dev.yml up mqtt iot-simulator

# Full stack (includes MQTT and simulator)
docker-compose up -d mqtt iot-simulator
```

Configure via environment variables (can be placed in an `.env` file in `iot-simulator/`):

- `MQTT_BROKER_HOST` (default `localhost` or `mqtt` in compose)
- `MQTT_BROKER_PORT` (default `1883`)
- `MQTT_TOPIC` (default `iot/waste_management/data`)
- `AREA_GEOJSON_PATH` (default `data/delhi_area.geojson`)
- `NUM_BINS` (default `20`)
- `NUM_VEHICLES` (default `5`)
- `SIMULATION_INTERVAL_SECONDS` (default `10`)

The simulator publishes JSON payloads to the configured topic. Use an MQTT client to subscribe:

```bash
# Example using mosquitto_sub
mosquitto_sub -h localhost -p 1883 -t iot/waste_management/data -v
``` 
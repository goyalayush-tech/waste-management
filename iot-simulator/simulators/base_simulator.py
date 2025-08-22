import json
import os
import random
import time
import uuid
from abc import ABC, abstractmethod

import paho.mqtt.client as mqtt
from dotenv import load_dotenv

load_dotenv()

class BaseSimulator(ABC):
    """
    Abstract base class for all IoT simulators.
    """
    def __init__(self, client_id_prefix="iot-simulator"):
        self.client_id = f'{client_id_prefix}-{uuid.uuid4()}'
        self.mqtt_broker_host = os.getenv("MQTT_BROKER_HOST", "localhost")
        self.mqtt_broker_port = int(os.getenv("MQTT_BROKER_PORT", 1883))
        self.mqtt_topic = os.getenv("MQTT_TOPIC", "iot/waste_management/data")
        
        self.client = mqtt.Client(client_id=self.client_id)
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print(f"Connected to MQTT Broker at {self.mqtt_broker_host}:{self.mqtt_broker_port}")
        else:
            print(f"Failed to connect, return code {rc}\n")

    def _on_disconnect(self, client, userdata, rc):
        print(f"Disconnected from MQTT Broker with result code {rc}")

    def connect(self):
        """Connects to the MQTT broker."""
        try:
            self.client.connect(self.mqtt_broker_host, self.mqtt_broker_port)
            self.client.loop_start()
        except ConnectionRefusedError:
            print("Connection to MQTT broker refused. Is the broker running?")
            exit(1)

    def disconnect(self):
        """Disconnects from the MQTT broker."""
        self.client.loop_stop()
        self.client.disconnect()

    @abstractmethod
    def generate_data(self):
        """
        Generates simulated data.
        This method must be implemented by subclasses.
        """
        pass

    def publish_data(self):
        """
        Generates and publishes data to the MQTT topic.
        """
        data = self.generate_data()
        payload = json.dumps(data)
        result = self.client.publish(self.mqtt_topic, payload)
        status = result[0]
        if status == 0:
            print(f"Sent `{payload}` to topic `{self.mqtt_topic}`")
        else:
            print(f"Failed to send message to topic {self.mqtt_topic}")

    def run(self, interval_seconds=10):
        """
        Runs the simulator, publishing data at a specified interval.
        """
        self.connect()
        try:
            while True:
                self.publish_data()
                time.sleep(interval_seconds)
        except KeyboardInterrupt:
            print("Simulation stopped by user.")
        finally:
            self.disconnect()

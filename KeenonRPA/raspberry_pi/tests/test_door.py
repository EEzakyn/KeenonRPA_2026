#from src import DoorController

import serial
import time


class DoorController:

    def __init__(self, port="COM3", baud=9600):
        try:
            self.ser = serial.Serial(port, baud, timeout=1)
            time.sleep(2)
            print("Door serial connected.")
        except Exception as e:
            print("Error opening serial:", e)
            self.ser = None

    def send(self, command):
        if self.ser is None:
            print("Serial not available.")
            return

        try:
            print("Sending:", command)
            self.ser.write((command + "\r\n").encode())
        except Exception as e:
            print("Send error:", e)

    def open_door(self, door_no):
        cmd = f"{{DOOR : {door_no} OPEN_WITH_TIMEOUT}}"
        self.send(cmd)

    def close_door(self, door_no):
        cmd = f"{{DOOR : {door_no} CLOSE}}"
        self.send(cmd)

    def close(self):
        if self.ser:
            self.ser.close()
            print("Door serial closed.")
"""
import serial
import time


class DoorController:

    def __init__(self, port="/dev/serial0", baud=9600):
        try:
            self.ser = serial.Serial(port, baud, timeout=1)
            time.sleep(2)
            print("Door serial connected.")
        except Exception as e:
            print("Error opening serial:", e)
            self.ser = None

    def send(self, command):
        if self.ser is None:
            print("Serial not available.")
            return

        try:
            full_cmd = b'\x02' + command.encode() + b'\x03'
            print("Sending:", full_cmd)

            self.ser.write(full_cmd)

        except Exception as e:
            print("Send error:", e)

    def open_door(self, door_no):
        cmd = f"{{DOOR : {door_no} OPEN_WITH_TIMEOUT}}"
        self.send(cmd)

    def close_door(self, door_no):
        cmd = f"{{DOOR : {door_no} CLOSE}}"
        self.send(cmd)

    def close(self):
        if self.ser:
            self.ser.close()
            print("Door serial closed.")
"""

door = DoorController()

door.open_door("007")
time.sleep(3)
door.close_door("007")

door.close()



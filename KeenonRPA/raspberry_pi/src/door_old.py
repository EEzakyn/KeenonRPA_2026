import serial
import time


class DoorController:

    def __init__(self, port="/dev/ttyUSB0", baud=9600):
        try:
            self.ser = serial.Serial(port, baud, timeout=1)
            time.sleep(2)
            print("Door serial connected.")
        except Exception as e:
            print("Door serial error:", e)
            self.ser = None

    def open(self, door_no):
        return self.send(f"{{DOOR : {door_no} OPEN_WITH_TIMEOUT}}")

    def close(self, door_no):
        return self.send(f"{{DOOR : {door_no} CLOSE}}")

    def shutdown(self):
        if self.ser:
            self.ser.close()

    def send(self, command, wait_response=True):
        if not self.ser:
            print("Serial not available")
            return False

        try:
            full_command = b'\x02' + command.encode() + b'\x03'
            print("Sending to door:", full_command)

            self.ser.write(full_command)

            if wait_response:
                time.sleep(0.5)
                response = self.ser.readline().decode(errors="ignore").strip()
                print("Door response:", response)

                return True#"OK" in response.upper()

            return True

        except Exception as e:
            print("Send error:", e)
            return False
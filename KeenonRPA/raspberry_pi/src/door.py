import serial
import time


class DoorController:

    def __init__(self, port="/dev/ttyUSB0", baud=9600, retry=3):
        self.port = port
        self.baud = baud
        self.ser = None

        self.connect(retry)

    # =========================
    # 🔌 CONNECT WITH RETRY
    # =========================
    def connect(self, retry=3):
        for i in range(retry):
            try:
                print(f"Connecting to {self.port} (try {i+1})...")
                self.ser = serial.Serial(self.port, self.baud, timeout=1)
                time.sleep(2)
                print("Door serial connected.")
                return True

            except Exception as e:
                print("Connect error:", e)
                time.sleep(2)

        print("❌ Failed to connect serial")
        self.ser = None
        return False

    # =========================
    # 🔄 RECONNECT
    # =========================
    def reconnect(self):
        print("Reconnecting serial...")
        if self.ser:
            try:
                self.ser.close()
            except:
                pass

        return self.connect()

    # =========================
    # 🚪 OPEN / CLOSE
    # =========================
    def open(self, door_no):
        return self.send(f"{{DOOR : {door_no} OPEN_WITH_TIMEOUT}}")

    def close(self, door_no):
        return self.send(f"{{DOOR : {door_no} CLOSE}}")

    # =========================
    # 📡 SEND COMMAND
    # =========================
    def send(self, command, wait_response=True):
        if not self.ser or not self.ser.is_open:
            print("⚠️ Serial not ready → reconnecting...")
            if not self.reconnect():
                return False

        try:
            full_command = b'\x02' + command.encode() + b'\x03'
            print("Sending:", full_command)

            self.ser.write(full_command)

            if wait_response:
                start = time.time()

                while time.time() - start < 2:  # timeout 2 วิ
                    if self.ser.in_waiting:
                        response = self.ser.readline().decode(errors="ignore").strip()
                        print("Door response:", response)

                        return "OK" in response.upper()

                print("⚠️ No response from door")
                return False

            return True

        except Exception as e:
            print("❌ Send error:", e)
            return self.reconnect()

    # =========================
    # 🔌 SHUTDOWN
    # =========================
    def shutdown(self):
        if self.ser and self.ser.is_open:
            self.ser.close()
            print("Serial closed.")
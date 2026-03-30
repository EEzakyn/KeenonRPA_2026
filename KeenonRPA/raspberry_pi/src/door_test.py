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

    def send_v1(self, command, wait_response=True):
        if not self.ser:
            print("Serial not available")
            return False

        try:
            print("Sending to door:", command)
            self.ser.write((command + "\r\n").encode())

            if wait_response:
                time.sleep(0.5)
                response = self.ser.readline().decode().strip()
                print("Door response:", response)

                if "OK" in response:
                    return True
                else:
                    return False

            return True

        except Exception as e:
            print("Send error:", e)
            return False

    def open(self, door_no):
        #success = self.send(f"{{DOOR : 007 OPEN_WITH_TIMEOUT}}")
        success = self.send("{DOOR : 007 OPEN_WITH_TIMEOUT}")
        return success

    def close(self, door_no):
        success = self.send(f"{{DOOR : {door_no} CLOSE}}")
        return success

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
                time.sleep(1)
                response = self.ser.readline().decode().strip()
                print("Door response:", response)

                return "OK" in response

            return True

        except Exception as e:
            print("Send error:", e)
            return False

s = DoorController()
door = s.send("{DOOR : 006 OPEN_WITH_TIMEOUT}",True)
print(door)
door_list = ['006','007']
s.shutdown()
#for i in door_list:
    #door.open('007')
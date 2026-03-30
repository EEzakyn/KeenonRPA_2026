from src import Robot, Sensor, Database, DustLogger

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from collections import deque

import os
from dotenv import load_dotenv

import threading
import time

import datetime

from src.door import DoorController
# Load configuration from .env file
load_dotenv()

"""
Start API server with this command:
python -m uvicorn api.app_v3:app --host 0.0.0.0 --port 8000
"""

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize robot, sensor, and database objects
robot = Robot()
sensor = Sensor()
db = Database()
logger = DustLogger()
Door = DoorController()

# Start the robot server
robot.start_server_in_background()

# configure valid routes for robot to change room, this is for checking the route before send command to robot
valid_routes = {
    'CR11': ['CR12'],
    'CR12': ['CR11', 'CR13'],
    'CR13': ['CR12', 'CR14'],
    'CR14': ['CR15'],
    'CR15': ['CR14', 'CR16'], 
    'CR16': ['CR15', 'CR17']
}

# setup door position
change_room_info = {
    #command_point : [point_room_a, point_room_b]
    "CR14_TO_CR15" : ["006","SN_02CR14", "LSI_001_CR15"],
    "CR15_TO_CR14" : ["006","LSI_001_CR15", "SN_02CR14"]
}


# List to store destination points
points = []
dust_data_buffer = []
activity_buffer = []
ucl_limit = int(os.getenv("UCL_LIMIT"))
max_retries = int(os.getenv("MAX_RETRIES", 3))
max_wait = int(os.getenv("MAX_WAIT", 120))

# Thread
stop_event = threading.Event()
lock = threading.Lock()
robot_thread = None  # Store the robot's thread

@app.get("/check-robot-connection")
async def check_robot_connection():
    """
    Check if the robot is connected.
    returns True if the robot is connected, otherwise False.
    """
    if robot.is_client_connected():
        return JSONResponse(
                content={"message": "True"},
                status_code=200 
            )
    return JSONResponse(
                content={"message": "False"},
                status_code=200 
            )

@app.get("/check-sensor-connection")
async def check_sensor_connection():
    """
    Check if the sensor is connected.
    returns True if the sensor is connected and measuring, otherwise False.
    """
    if sensor.is_measuring or sensor.is_sensor_connected():
        return JSONResponse(
                    content={"message": "True"},
                    status_code=200 
                )
        
    return JSONResponse(
                content={"message": "False"},
                status_code=200 
            )
    
@app.get("/check-database-connection")
async def check_database_connection():
    """
    Check if the database is connected.
    returns True if the database is connected, otherwise False.
    """
    if db.is_database_connected():
        return JSONResponse(
                    content={"message": "True"},
                    status_code=200 
                )
        
    return JSONResponse(
                content={"message": "False"},
                status_code=200 
            )

class ListPointsRequest(BaseModel):
    points: List[str]  # Define a request model for receiving multiple destination points

@app.post("/add-points")
async def add_points(data: ListPointsRequest):
    """
    Add a list of destination points to the robot's queue.

    This endpoint allows a user to add multiple destination points at once. 
    The robot will visit these points and perform measurements.

    **Request body**:
    - **points**: A list of destination points to be added. Example: 
    {
        "points": [
           "6002-IS-1K017-default",
           "6002-IS-1K018-default",
           "6002-IS-1K019-default"
        ]
    }

    **Response**:
    - A message indicating the points that were added and The current list of destination points.
    """
    with lock:
        run_path_points = process_cr_list(data.points, valid_routes)
        points.extend(run_path_points)
    print(f"Added {run_path_points} to the queue.")
    return JSONResponse(
                content={"message": f"Added {run_path_points} to the queue.", "points": points},
                status_code=200 
            )

@app.get("/get-points")
async def get_points():
    """
    Get the remaining destination points in the queue.

    This endpoint allows the user to see the points left in the queue for the robot to visit.

    **Response**: The current list of destination points.
    """
    print(f"Get points {points}")
    return JSONResponse(
                content={"points": points if points else None},
                status_code=200 
            )

@app.delete("/del-points")
async def del_points():
    """
    Delete all destination points in the queue.

    This endpoint clears the queue of all stored destination points.

    **Response**: A message indicating the queue has been cleared.
    """
    points.clear()
    print("Delete all points")
    
    return JSONResponse(
                content={"message": "Delete all points"},
                status_code=200 
            )

def change_room_controller(point):
    print(f"Changing room for point: {point}")


    #robot.search_ui_and_click("default") 
    robot.search_ui_and_click(change_room_info[point][1])  # go to door

    if stop_event.is_set():
        print("Interrupted: Stopping robot process...")
        return
    
    robot.send_command("Go")
    print(f"Robot is going to {change_room_info[point][1]}...")
    save_activity_log_safe((datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'), point, f"Going to [{point}]"))

    now_sec = 0
    while not robot.is_have_ui("Go"):
        if stop_event.is_set():
            print("Interrupted: Stopping robot process...")
            return
        time.sleep(0.5)
        now_sec += 0.5
        print(f"Waiting {now_sec}/{max_wait}")
        if now_sec >= max_wait:
            print("Timeout")
            break

        print(f"Robot at point: {point}")
        #save_activity_log_safe((datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'), point, f"Robot at [{point}]"))
    robot.send_command("clickBackButton")
    robot.send_command("Direct")
    robot.search_ui_and_click(change_room_info[point][2])  # go to door

    while not doors_control(change_room_info[point][0], "open"):  # open door
        print(f"door {change_room_info[point][0]} not response")

    

    if stop_event.is_set():
        print("Interrupted: Stopping robot process...")
        return
    
    robot.send_command("Go")
    print(f"Robot is going to {change_room_info[point][2]}...")
    save_activity_log_safe((datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'), point, f"Going to [{point}]"))

    now_sec = 0
    while not robot.is_have_ui("Go"):
        door_response = doors_control(change_room_info[point][0], "open")
        if stop_event.is_set():
            print("Interrupted: Stopping robot process...")
            return
        time.sleep(0.5)
        now_sec += 0.5
        print(f"Waiting {now_sec}/{max_wait}")
        if now_sec >= max_wait:
            print("Timeout")
            break

        print(f"Robot at point: {point}")
        save_activity_log_safe((datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'), point, f"Robot at [{point}]"))

    doors_control(change_room_info[point][0], "close")  # close door
    return

    
def doors_control(door_id,status):
    door_response = False
    if status == "open":
        door_response = Door.open(door_id)
    elif status == "close":
        door_response = Door.close(door_id)
    else:
        print(f"Invalid door status: {status}")
    return door_response

def find_shortest_path(graph,start, end):
    if start == end:
        return [start]
    
    queue = deque([[start]])
    visited = set([start])
    
    while queue:
        path = queue.popleft()
        node = path[-1]
        
        # find neighbors room in valid_routes
        for neighbor in graph.get(node, []):
            if neighbor == end:
                return path + [neighbor]
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(path + [neighbor])
                
    return None # not find path

def process_cr_list(input_point, graph):
    if not input_point:
        return []
    
    result = []
    for i in range(len(input_point)):
        current_item = input_point[i]
        current_cr = current_item[-4:]

        if i>0:
            prev_item = input_point[i-1]
            prev_cr = prev_item[-4:]

            if prev_cr != current_cr:
                path = find_shortest_path(graph, prev_cr, current_cr)
                if path:
                    for p in range(len(path)-1):
                        transition_str = f"{path[p]}_TO_{path[p+1]}"
                        result.append(transition_str)
                else:
                    print(f"No path found from {prev_cr} to {current_cr}")
                    return result
        result.append(current_item)
    return result

def save_activity_log_safe(activity):
    try:
        db.save_activity_log(activity)
        print(f"Saved activity log at {activity[1]}")
    except Exception as e:
        activity_buffer.append(activity)
        print(f"Database error: {e}. Storing offline.")


def save_measurement_safe(dust_data):
    tuple_dust_data = tuple(dust_data.values())
    try:
        db.save_measurement(tuple_dust_data)
        print(f"Saved dust data at {dust_data['location_name']}")
    except Exception as e:
        dust_data_buffer.append(tuple_dust_data)
        print(f"DB error: {e}")

    try:
        logger.save_measurement_log(dust_data)
    except Exception as e:
        print(f"Log error: {e}")


def perform_dust_measurement(point, required_send_database):
    for count in range(1, max_retries + 1):
        print(f"Start measurement at point: {point} count: {count}/{max_retries}...")
        
        save_activity_log_safe((datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'), point, f"Measuring start {count}/{max_retries}]"))
        
        try:
            sensor.start_measurement()
            dust_data = sensor.read_data()
        except Exception as e:
            print(f"Sensor error: {e}")
            continue

        save_activity_log_safe((datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'), point, f"Measuring finish {count}/{max_retries}]"))

        dust_data['location_name'] = point
        dust_data['count'] = count
        um03 = dust_data.get('um03', 0)

        if um03 > ucl_limit:
            dust_data['alarm_high'] = 1
            save_activity_log_safe((datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'), point, "Result NG"))
            print(f"Dust level at {point} exceeded UCL ({um03}). Retrying ...")
        else:
            dust_data['alarm_high'] = 0
            save_activity_log_safe((datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'), point, "Result OK"))

        print(dust_data)

        if required_send_database:
            save_measurement_safe(dust_data)
            save_activity_log_safe((datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'), point, f"Save data to database"))
        
        if um03 <= ucl_limit:
            break

        time.sleep(2)


def start_dust_task(required_send_database):
    global stop_event, points, dust_data_buffer, activity_buffer

    if not points:
        print("No points in queue.")
        return

    robot.send_command("goHome")
    time.sleep(1)
    robot.send_command("Peanut Food Delivery")
    time.sleep(2)

    while points:
        if stop_event.is_set():
            print("Interrupted: Stopping robot process...")
            return

        with lock:
            point = points.pop(0)

        robot.send_command("clickBackButton")
        robot.send_command("Direct")

        if point in change_room_info:  # change room
            change_room_controller(point)
            continue

        elif "CR11" in point:
            if not robot.search_ui_and_click("BLD1_CR11"):
                print(f"No point found, skip {point}")
                continue
        elif "CR12" in point:
            if not robot.search_ui_and_click("BLD1_CR12"):
                print(f"No point found, skip {point}")
                continue
        elif "CR13" in point:
            if not robot.search_ui_and_click("BLD1_CR13"):
                print(f"No point found, skip {point}")
                continue
        elif "CR14" in point:
            if not robot.search_ui_and_click("BLD1_CR14"):
                print(f"No point found, skip {point}")
                continue
        elif "CR15" in point:
            if not robot.search_ui_and_click("BLD1_CR15"):
                print(f"No point found, skip {point}")
                continue
        elif "CR16" in point:
            if not robot.search_ui_and_click("BLD1_CR16"):
                print(f"No point found, skip {point}")
                continue
        

        if not robot.search_ui_and_click(point):
            print(f"No point found, skip {point}")
            continue

        if stop_event.is_set():
            print("Interrupted: Stopping robot process...")
            return

        robot.send_command("Go")
        print(f"Robot is going to {point}...")
        save_activity_log_safe((datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'), point, f"Going to [{point}]"))
        time.sleep(1)
        now_sec = 0
        while not robot.is_have_ui("Go"):
            if stop_event.is_set():
                print("Interrupted: Stopping robot process...")
                return
            time.sleep(1)
            now_sec += 1
            print(f"Waiting {now_sec}/{max_wait}")
            if now_sec >= max_wait:
                print("Timeout")
                break

        print(f"Robot at point: {point}")
        save_activity_log_safe((datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'), point, f"Robot at [{point}]"))

        perform_dust_measurement(point, required_send_database)
        print(f"Finished point: {point}")

    if dust_data_buffer:
        print("Retrying to save measurements...")
        try:
            db.save_measurement(dust_data_buffer)
            dust_data_buffer.clear()
        except Exception as e:
            print(f"Still unable to save measurements: {e}")

    if activity_buffer:
        print("Retrying to save activity logs...")
        try:
            db.save_activity_log(activity_buffer)
            activity_buffer.clear()
        except Exception as e:
            print(f"Still unable to save activity logs: {e}")

    print("All measurements completed.")


class OperationRequest(BaseModel):
    required_send_database: bool

@app.post("/start-dust")
async def start_dust(request: OperationRequest):
    """
    Start the robot process to go through all points in the queue.

    This endpoint starts the robot's task of going to all destination points in the queue 
    and performing measurements at each point.

    **Request Body**:
    - required_send_database (bool): Whether to send measurement data to the database.

    **Response**: A message indicating the robot process has started.
    """
    global robot_thread, stop_event

    with lock:
        if robot_thread is not None and robot_thread.is_alive():
            return JSONResponse(
                content={"message": "Robot process is already running."},
                status_code=400
            )
            
    if not points:
        return JSONResponse(
            content={"message": "No points in queue."},
            status_code=400
        )
        
    if not robot.is_client_connected():
         return JSONResponse(
            content={"message": "Robot not connect"},
            status_code=400
        )
    
    if not sensor.is_sensor_connected():
         return JSONResponse(
            content={"message": "Sensor not connect"},
            status_code=400
        )
         
    if not db.is_database_connected():
         return JSONResponse(
            content={"message": "Database not connect"},
            status_code=400
        )
         
    stop_event.clear()

    robot_thread = threading.Thread(
        target=start_dust_task,
        args=(request.required_send_database,),  
        daemon=True
    )
    robot_thread.start()

    return JSONResponse(
        content={"message": "Robot process started."},
        status_code=200
    )


@app.get("/stop-dust")
async def stop_dust():
    """
    Stop the robot process.

    This endpoint stops the robot from continuing its tasks. The task will stop at the current point.
    If the robot process hasn't started, it will return a message indicating no active process.
    
    **Response**: A message indicating the robot process is being stopped or that no process is running.
    """
    global robot_thread, stop_event

    # Stop the sensor measurement if it's running
    if sensor.is_measuring:
        sensor.stop_measurement()
        print("Sensor measurement stopped.")

    # Check if the robot process has already started
    with lock: 
        if robot_thread is None or not robot_thread.is_alive():
            return JSONResponse(
                content={"message": "No active robot process to stop."},
                status_code=400 # Return a 400 Bad Request if not running
            )

    # If the robot process is running, stop it
    stop_event.set()
    return JSONResponse(
                content={"message": "Stopping robot process..."},
                status_code=200 
            )


def start_transportation_task():
    """
        Task to move the robot through all points in the queue.
        This function will:
        
    """
    global stop_event, points, activity_buffer

    if not points:
        print("No points in queue.")
        return
    

    robot.send_command("goHome")
    time.sleep(1)
    robot.send_command("Peanut Food Delivery")
    time.sleep(2)

    
    while points:
        if stop_event.is_set():
            print("Interrupted: Stopping robot process...")
            return
        
        robot.send_command("clickBackButton")
        robot.send_command("Direct")
        
        with lock:
            point = points.pop(0)

        if point in change_room_info:  # change room
                change_room_controller(point)
                continue
        
        elif "CR11" in point:
            if not robot.search_ui_and_click("BLD1_CR11"):
                print(f"No point found, skip {point}")
                continue
        elif "CR12" in point:
            if not robot.search_ui_and_click("BLD1_CR12"):
                print(f"No point found, skip {point}")
                continue
        elif "CR13" in point:
            if not robot.search_ui_and_click("BLD1_CR13"):
                print(f"No point found, skip {point}")
                continue
        elif "CR14" in point:
            if not robot.search_ui_and_click("BLD1_CR14"):
                print(f"No point found, skip {point}")
                continue
        elif "CR15" in point:
            if not robot.search_ui_and_click("BLD1_CR15"):
                print(f"No point found, skip {point}")
                continue
        elif "CR16" in point:
            if not robot.search_ui_and_click("BLD1_CR16"):
                print(f"No point found, skip {point}")
                continue


        if not robot.search_ui_and_click(point):
            print(f"No point found, skip {point}")
            continue

        if stop_event.is_set():
            print("Interrupted: Stopping robot process...")
            return

        robot.send_command("Go")
        print(f"Robot is going to {point}...")
        save_activity_log_safe((datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'), point, f"Going to [{point}]"))
        time.sleep(1)
        now_sec = 0
        while not robot.is_have_ui("Go"):
            if stop_event.is_set():
                print("Interrupted: Stopping robot process...")
                return
            time.sleep(0.5)
            now_sec += 1
            print(f"Waiting {now_sec}/{max_wait}")
            if now_sec >= max_wait:
                print("Timeout")
                break

        print(f"Robot at point: {point}")
        save_activity_log_safe((datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'), point, f"Robot at [{point}]"))

        
            

@app.post("/start-transportation")
async def start_transportation():
    """
    Start the robot process to go through all points in the queue.
 
    **Response**: A message indicating the robot process has started.
    """
    global robot_thread, stop_event

    with lock:
        if robot_thread is not None and robot_thread.is_alive():
            return JSONResponse(
                content={"message": "Robot process is already running."},
                status_code=400
            )

    if not points:
        return JSONResponse(
            content={"message": "No points in queue."},
            status_code=400
        )
        
    if not robot.is_client_connected():
        return JSONResponse(
            content={"message": "Robot not connect"},
            status_code=400
        )
    
    #if not db.is_database_connected():
    #    return JSONResponse(
    #        content={"message": "Database not connect"},
    #        status_code=400
    #    )

    stop_event.clear()

    robot_thread = threading.Thread(
        target=start_transportation_task,
        daemon=True
    )
    robot_thread.start()

    return JSONResponse(
        content={"message": "Robot process started."},
        status_code=200
    )
    
@app.get("/stop-transportation")
async def stop_transportation():
    """
    Stop the robot process.

    This endpoint stops the robot from continuing its tasks. The task will stop at the current point.
    If the robot process hasn't started, it will return a message indicating no active process.
    
    **Response**: A message indicating the robot process is being stopped or that no process is running.
    """
    global robot_thread, stop_event

    # Check if the robot process has already started
    with lock: 
        if robot_thread is None or not robot_thread.is_alive():
            return JSONResponse(
                content={"message": "No active robot process to stop."},
                status_code=400 # Return a 400 Bad Request if not running
            )

    # If the robot process is running, stop it
    stop_event.set()
    return JSONResponse(
                content={"message": "Stopping robot process..."},
                status_code=200 
            )
    

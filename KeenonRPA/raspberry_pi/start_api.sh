#!/bin/bash
cd /home/pi/Desktop/Senior_project_dust_measurement/KeenonRPA/raspberry_pi
source venv/bin/activate
uvicorn api.app_v3:app --host 0.0.0.0 --port 8000
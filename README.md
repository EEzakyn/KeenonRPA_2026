# KeenonRPA 2026 - Dust Measurement & Robot Automation System

Real-time dust measurement monitoring with robotic automation and web-based dashboard. Combines Raspberry Pi backend (Python FastAPI), web frontend (React), and hardware controllers.

## Quick Start

### Backend Setup (Raspberry Pi)

```bash
cd KeenonRPA/raspberry_pi

# Install dependencies
pip install -r requirements.txt

# Create .env file with your settings
export RPA_PORT=12345
export SOLAIR_IP=192.168.1.100
export DB_HOST=your_database_host

# Run API
python -m uvicorn api.app_v3:app --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd Dustdashboard/client

# Install and run
npm install
npm run dev
```

Access dashboard at `http://localhost:5173`

## Key Components

- **Backend**: FastAPI server on Raspberry Pi (port 8000)
- **Frontend**: React + TypeScript dashboard
- **Sensor**: SOLAIR 1100LD dust measurement (Modbus TCP)
- **Database**: MSSQL Server
- **Hardware**: Android robot, ESP32 charger, door controller

## Configuration

Create `.env` file in `KeenonRPA/raspberry_pi`:

```env
# Server
RPA_BIND=0.0.0.0
RPA_PORT=12345
API_PORT=8000

# Sensor
SOLAIR_IP=192.168.1.100
SLAVE=1
MEASUREMENT_TIME=70

# Database
DB_HOST=your_host
DB_PORT=1433
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database
```

Edit API endpoint in `Dustdashboard/client/src/configs/apiConfig.ts`:
```typescript
export const API_BASE_URL = 'http://<your_raspberry_pi_ip>:8000';
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/check-robot-connection` | GET | Check robot status |
| `/add-points` | POST | Add measurement points |
| `/del-points` | DELETE | Delete all points |
| `/get-points` | GET | Get current points |
| `/start-transportation` | POST | Start robot movement |
| `/start-dust` | POST | Start dust measurement |

See [command_list.txt](command_list.txt) for curl examples.

## Project Structure

```
KeenonRPA_2026/
├── KeenonRPA/raspberry_pi/
│   ├── api/app_v3.py          (FastAPI server)
│   ├── src/                   (Robot, Sensor, Database modules)
│   └── requirements.txt
├── Dustdashboard/client/      (React frontend)
├── ESP32_code_charger_module/ (Hardware firmware)
└── command_list.txt           (API examples)
```

## Troubleshooting

**Cannot connect to API**
```bash
curl http://<raspberry_pi_ip>:8000/docs
```

**Sensor connection failed** - Check SOLAIR_IP in .env and network connectivity

**Database error** - Verify MSSQL credentials and server accessibility

## More Info

- [Backend README](KeenonRPA/README.md)
- [Dashboard README](Dustdashboard/README.md)  
- [API Commands](command_list.txt)
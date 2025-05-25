# Dead Zone Game API Integration

This document outlines how to set up and run the server and game integration for Dead Zone.

## Server Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB

### Installation & Running

1. Navigate to the server directory:
   ```
   cd "e:\Code\Game\DuAn\Dead_Zone_Server"
   ```

2. Install dependencies (if needed):
   ```
   npm install
   ```

3. Start MongoDB service (if not running):
   ```
   mongod --dbpath="C:\data\db"
   ```
   (Adjust the dbpath according to your MongoDB installation)

4. Start the server:
   ```
   npm start
   ```

5. The server should be running at http://localhost:5000

## Game Integration

The Unity project has been updated with the following components for API integration:

- `GameAPI.cs`: Main API interface for authentication and data operations
- `PlayerDataManager.cs`: Manages player data synchronization between game state and server
- `GameSaveManager.cs`: Handles auto-saving and saving on scene changes/exit

### Playing the Game

1. Start the game and you'll be presented with a login/register screen
2. Create a new account or log in with existing credentials
3. Your game progress is automatically saved:
   - Every 5 minutes (configurable)
   - When changing levels
   - When exiting the game

### Data Stored on Server

- Player account: username, email, password (hashed)
- Game progress: health, money, weapons, ammo, checkpoints
- Weapon upgrades and status

## Troubleshooting

If you encounter issues:

1. Verify MongoDB is running
2. Check server console for any errors
3. Make sure the game is connecting to the correct server URL
4. Check Unity console for API connection errors

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/user` - Get current user info

### Player Data
- `GET /api/player/data` - Get player data
- `PUT /api/player/save` - Save all player data
- Plus specific endpoints for weapons, money, ammo, etc.

# Snakstract Game Server Startup Script for Windows PowerShell
# This script starts both the frontend and backend servers

Write-Host "🐍 Starting Snakstract Game Servers..." -ForegroundColor Green
Write-Host ""

# Function to start a server in a new window
function Start-ServerInNewWindow {
    param(
        [string]$ServerName,
        [string]$Command,
        [string]$WorkingDirectory
    )
    
    Write-Host "Starting $ServerName..." -ForegroundColor Yellow
    
    # Start the server in a new PowerShell window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$WorkingDirectory'; $Command" -WindowStyle Normal
    
    Write-Host "$ServerName started in new window" -ForegroundColor Green
    Write-Host ""
}

# Start the backend server (Node.js)
Write-Host "🚀 Starting Backend Server..." -ForegroundColor Cyan
Start-ServerInNewWindow -ServerName "Backend Server" -Command "node index.js" -WorkingDirectory "server"

# Wait a moment for the backend to start
Start-Sleep -Seconds 2

# Start the frontend server (Vite)
Write-Host "🎮 Starting Frontend Server..." -ForegroundColor Cyan
Start-ServerInNewWindow -ServerName "Frontend Server" -Command "npm run dev" -WorkingDirectory "frontend"

Write-Host ""
Write-Host "✅ Both servers are starting..." -ForegroundColor Green
Write-Host ""
Write-Host "📋 Server Information:" -ForegroundColor White
Write-Host "   • Backend: http://localhost:3001" -ForegroundColor Gray
Write-Host "   • Frontend: http://localhost:5173" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 Open your browser and navigate to: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this script (servers will continue running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 
 
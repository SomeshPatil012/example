const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let mainWindow;
let terminalProcess = null;
let pythonProcess = null;
let currentDirectory = process.cwd();

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false
        }
    });

    mainWindow.loadFile('index.html');

    startTerminalProcess();
});

// 🟢 Start System Shell (CMD/Bash)
function startTerminalProcess() {
    if (terminalProcess) return;

    terminalProcess = spawn(process.platform === 'win32' ? 'cmd.exe' : 'bash', [], {
        cwd: currentDirectory,
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe']
    });

    terminalProcess.stdout.on('data', (data) => {
        mainWindow.webContents.send('terminal-output', { type: 'stdout', message: data.toString() });
    });

    terminalProcess.stderr.on('data', (data) => {
        mainWindow.webContents.send('terminal-output', { type: 'stderr', message: data.toString() });
    });

    terminalProcess.on('close', () => {
        terminalProcess = null;
        startTerminalProcess(); // Restart terminal if closed
    });
}

// 🟢 Run Python Code (Handle `input()`)
ipcMain.on('run-python', (event, code) => {
    const tempFilePath = path.join(__dirname, 'temp.py');
    fs.writeFileSync(tempFilePath, code);

    if (pythonProcess) {
        pythonProcess.kill();
    }

    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    pythonProcess = spawn(pythonCmd, [tempFilePath], { stdio: ['pipe', 'pipe', 'pipe'] });

    pythonProcess.stdout.on('data', (data) => {
        event.reply('terminal-output', { type: 'stdout', message: data.toString() });
    });

    pythonProcess.stderr.on('data', (data) => {
        event.reply('terminal-output', { type: 'stderr', message: data.toString() });
    });

    pythonProcess.on('close', (code) => {
        event.reply('terminal-output', { type: 'stdout', message: `Process exited with code ${code}` });
        pythonProcess = null;
        fs.unlink(tempFilePath, () => {});
    });
});

// 🟢 Handle Terminal Input (Detect Python vs Shell)
ipcMain.on('terminal-input', (event, input) => {
    if (pythonProcess) {
        pythonProcess.stdin.write(input + '\n'); // Send input to Python if running
    } else {
        terminalProcess.stdin.write(input + '\n'); // Otherwise, send to CMD/Bash
    }
});

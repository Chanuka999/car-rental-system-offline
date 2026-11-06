const {
  app,
  BrowserWindow,
  dialog
} = require('electron');

const {
  spawn,
  execFile
} = require('child_process');

const net = require('net');
const fs = require('fs');
const path = require('path');

const config = require('./config');

let mainWindow = null;

let databaseProcess = null;
let backendProcess = null;

let databaseStartedByApp = false;
let isQuitting = false;

const DATABASE_HOST = config.database.host;
const DATABASE_PORT = config.database.port;

const BACKEND_URL =
  `http://${config.backend.host}:${config.backend.port}/up`;

const FRONTEND_FILE = config.frontend.buildFile;

// Check whether a TCP port is accepting connections.
function isPortOpen(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.setTimeout(1000);

    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

// Wait until a TCP port becomes available.
async function waitForPort(host, port, timeout = 60000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await isPortOpen(host, port)) {
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error(`Port ${port} is not available.`);
}

// Start MariaDB if it is not already running.
async function startDatabase() {
  console.log('Checking MariaDB status...');

  const alreadyRunning = await isPortOpen(
    DATABASE_HOST,
    DATABASE_PORT
  );

  if (alreadyRunning) {
    console.log('MariaDB is already running.');

    databaseStartedByApp = false;
    return;
  }

  if (!fs.existsSync(config.database.executable)) {
    throw new Error(
      `MariaDB executable not found: ${config.database.executable}`
    );
  }

  if (!fs.existsSync(config.database.config)) {
    throw new Error(
      `MariaDB configuration not found: ${config.database.config}`
    );
  }

  console.log('Starting MariaDB...');

  databaseProcess = spawn(
    config.database.executable,
    [
      `--defaults-file=${config.database.config}`,
      `--basedir=${config.database.baseDirectory}`,
      `--datadir=${config.database.dataDirectory}`,
      `--tmpdir=${config.database.tempDirectory}`,
      `--log-error=${config.database.errorLog}`,
      '--standalone'
    ],
    {
      cwd: config.database.workingDirectory,
      windowsHide: true,
      stdio: 'ignore'
    }
  );

  databaseStartedByApp = true;

  databaseProcess.once('error', (error) => {
    console.error('MariaDB process error:', error);
  });

  databaseProcess.once('exit', (code) => {
    console.log('MariaDB exited:', code);
  });

  await waitForPort(
    DATABASE_HOST,
    DATABASE_PORT,
    60000
  );

  console.log('MariaDB is ready.');
}

// Start Laravel backend.
function startBackend() {
  console.log('Starting Laravel backend...');

  backendProcess = spawn(
    config.backend.phpCommand,
    [
      'artisan',
      'serve',
      '--host',
      config.backend.host,
      '--port',
      String(config.backend.port)
    ],
    {
      cwd: config.backend.directory,
      windowsHide: true,
      stdio: 'ignore'
    }
  );

  backendProcess.once('error', (error) => {
    console.error('Laravel process error:', error);
  });

  backendProcess.once('exit', (code) => {
    console.log('Laravel exited:', code);
  });
}

// Wait until Laravel API responds successfully.
async function waitForBackend(timeout = 60000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(BACKEND_URL);

      if (response.ok) {
        return true;
      }
    } catch (error) {
      // Laravel is not ready yet.
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error('Laravel API did not become ready.');
}

// Create Electron window.
async function createWindow() {
  if (!fs.existsSync(FRONTEND_FILE)) {
    throw new Error(
      `Angular production build not found: ${FRONTEND_FILE}`
    );
  }

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1000,
    minHeight: 650,
    show: false,
    title: 'Car Rental Management System',

    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  // Register event BEFORE loading the frontend.
  mainWindow.once('ready-to-show', () => {
    console.log('Electron window is ready.');
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Load Angular production build.
  await mainWindow.loadFile(FRONTEND_FILE);

  console.log('Angular frontend loaded successfully.');

  // Fallback: ensure window becomes visible.
  if (mainWindow && !mainWindow.isVisible()) {
    mainWindow.show();
  }
}

// Stop a Windows process and its child processes.
function stopWindowsProcess(child) {
  if (!child || !child.pid) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    execFile(
      'taskkill',
      [
        '/pid',
        String(child.pid),
        '/T',
        '/F'
      ],
      () => resolve()
    );
  });
}

// Stop processes started by this application only.
async function stopProcesses() {
  console.log('Stopping application processes...');

  // Stop Laravel backend first.
  if (backendProcess) {
    await stopWindowsProcess(backendProcess);
    backendProcess = null;
  }

  // Gracefully stop MariaDB only if this app started it.
  if (databaseStartedByApp && databaseProcess) {
    await new Promise((resolve) => {
      execFile(
        config.adminExecutable,
        [
          '-h',
          DATABASE_HOST,
          '-P',
          String(DATABASE_PORT),
          '-u',
          'root',
          'shutdown'
        ],
        {
          windowsHide: true
        },
        (error) => {
          if (error) {
            console.error(
              'MariaDB graceful shutdown failed:',
              error.message
            );

            console.log(
              'MariaDB has been left running to protect database files.'
            );
          } else {
            console.log('MariaDB stopped gracefully.');
            databaseProcess = null;
            databaseStartedByApp = false;
          }

          resolve();
        }
      );
    });
  }

  console.log('Application processes stopped.');
}

// Configure writable Electron application data directories.
const appDataRoot = path.join(
  app.getPath('appData'),
  'CarRentalOffline'
);

const userDataPath = path.join(appDataRoot, 'UserData');
const sessionDataPath = path.join(appDataRoot, 'SessionData');
const cachePath = path.join(sessionDataPath, 'Cache');

// Create directories if they do not exist.
fs.mkdirSync(userDataPath, { recursive: true });
fs.mkdirSync(sessionDataPath, { recursive: true });
fs.mkdirSync(cachePath, { recursive: true });

// Set Electron storage paths before app becomes ready.
app.setPath('userData', userDataPath);
app.setPath('sessionData', sessionDataPath);

// Configure Chromium cache locations.
app.commandLine.appendSwitch('disk-cache-dir', cachePath);
app.commandLine.appendSwitch(
  'gpu-cache-dir',
  path.join(cachePath, 'GPUCache')
);

// Application startup.
app.whenReady().then(async () => {
  try {
    console.log('Starting Car Rental System...');

    // 1. Start database.
    await startDatabase();

    // 2. Start Laravel.
    startBackend();

    // 3. Wait for Laravel API.
    await waitForBackend();

    console.log('Laravel API is ready.');

    // 4. Open Electron window.
    await createWindow();

    console.log('Car Rental Desktop is ready.');

  } catch (error) {
    console.error('Startup error:', error);

    dialog.showErrorBox(
      'Application Startup Error',
      error.message
    );

    await stopProcesses();

    app.exit(1);
  }
});

// Clean up when application closes.
app.on('before-quit', (event) => {
  if (isQuitting) {
    return;
  }

  event.preventDefault();

  isQuitting = true;

  stopProcesses().finally(() => {
    app.exit(0);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
const { app, BrowserWindow } = require('electron');
   const path = require('path');
   const { spawn } = require('child_process');

   let mainWindow;
   let serverProcess;

   function createWindow() {
     // Start the Express server
     serverProcess = spawn('node', ['main.js'], {
       stdio: 'inherit',
       cwd: __dirname
     });

     // Wait for server to start then create window
     setTimeout(() => {
       mainWindow = new BrowserWindow({
         width: 1400,
         height: 900,
         minWidth: 1200,
         minHeight: 700,
         webPreferences: {
           nodeIntegration: false,
           contextIsolation: true,
           webSecurity: false,
           enableRemoteModule: false,
           preload: path.join(__dirname, 'preload.js'),
           webviewTag: true,
           allowRunningInsecureContent: true,
           experimentalFeatures: true
         },
         icon: path.join(__dirname, 'assets', 'icon.png')
       });

       mainWindow.loadURL('http://localhost:5000');

       mainWindow.on('closed', () => {
         mainWindow = null;
       });
     }, 2000);
   }

   app.whenReady().then(createWindow);

   app.on('window-all-closed', () => {
     if (serverProcess) {
       serverProcess.kill();
     }
     if (process.platform !== 'darwin') {
       app.quit();
     }
   });

   app.on('activate', () => {
     if (BrowserWindow.getAllWindows().length === 0) {
       createWindow();
     }
   });
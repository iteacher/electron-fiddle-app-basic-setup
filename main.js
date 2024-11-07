/*
  =============================================================
  Author: Julian Manders-Jones
  Date: October 2024
  Project: Binary Search Tree Visualiser
  Repo: https://github.com/iteacher/bstvisualiser

  Description: an interactive tool designed for learners, educators, and developers interested in deepening their understanding of binary search trees. This app offers a dynamic approach to studying BSTs by enabling users to visually interact with and manipulate the tree structure.
  
  © 2024 Julian Manders-Jones. All rights reserved.
  
  This file is part of Binary Search Tree Visualiser.

  MIT License
  You may obtain a copy of the License at [Link to LICENSE file]
  
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  =============================================================
*/

const { app, BrowserWindow } = require('electron');

function createWindow() {
  // Create the browser window with typical options
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    resizable: true,      // Allow resizing
    frame: true,          // Adds the default OS frame with min, max, close buttons
    backgroundColor: '#ffffff', // Set a white background color for a cleaner look
    webPreferences: {
      nodeIntegration: true, // Allow Node.js integration
      contextIsolation: false, // Disable context isolation to simplify access in renderer process
      enableRemoteModule: true // Enable remote module (useful for some use cases)
    }
  });

  // Load your app's main HTML file
  mainWindow.loadFile('index.html');

  // Open DevTools by default for development
  //mainWindow.webContents.openDevTools();
}

// When Electron has finished initializing, create the window
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


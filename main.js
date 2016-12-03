// 'use strict';
/* see:
 *  http://stackoverflow.com/questions/33230044/how-to-load-my-angular-app-correctly-with-electron-throu-file
 * */
var http = require('http');
// var path = require('path');
var fs = require('fs');
// var app = require('app');
// var BrowserWindow = require('browser-window');


const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;


const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
// let mainWindow
// var mainWindow;

// require('crash-reporter').start();

var mainWindow = null;


function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({ width: 1000, height: 600 });

    /*    // and load the index.html of the app.
     mainWindow.loadURL(url.format({
     pathname: path.join(__dirname, 'index.html'),
     protocol: 'file:',
     slashes: true
     }));*/

    var server = http.createServer(requestHandler).listen(9527);
    // var server = http.createServer(requestHandler).listen(9125);

    mainWindow.loadURL('http://localhost:9527/index.html');
    /* loadUrl() was renamed to loadURL() a while back.
     * see: http://stackoverflow.com/questions/37614054/loadurl-is-not-working-in-electron/37614774
     * */


    mainWindow.webContents.on('did-finish-load', function() {
        mainWindow.setTitle(app.getName());
    });

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    /* see:
    https://github.com/google/google-api-javascript-client/issues/222
    */
    /* see:  https://github.com/electron/electron/blob/master/docs/api/web-contents.md#event-new-window
     */

    mainWindow.webContents.on('new-window', handleNewWindow);
    var appDomain = 'http://localhost:9527/';

    function handleNewWindow(e, url, frameName, disposition, options) {
        // Catch OAuth opening a new window and attach callbacks to close it and redirect the main
        // window after it has logged in

        console.log("new-window: " + url + " frameName: " + frameName + " disposition: " + disposition);
        console.log("options:");
        console.log(JSON.stringify(options));


        if (url.indexOf('https://accounts.google.com') === 0) {

            console.log('https://accounts.google.com'); // writes to bash console

            options.titleBarStyle = 'default';

            var authWindow = new BrowserWindow(options);
            // did-navigate:
            // https://github.com/electron/electron/blob/master/docs/api/web-contents.md#event-did-navigate

            authWindow.webContents.on('did-navigate', function(e, navURL) {

                console.log('did-navigate: ' + navURL);

                if (navURL.indexOf(appDomain) === 0) {
                    setTimeout(function() {
                        authWindow.close();
                        // mainWindow.loadURL(appURL + '&login=true');
                        mainWindow.loadURL(appURL + 'testvideo/recordvideo.html');
                    }, 0);
                }
            });

            authWindow.loadURL(url);
            e.preventDefault();
            authWindow.webContents.on('destroyed', function() {
                console.log('destroyed: ' + url);
                mainWindow.reload(); // https://github.com/electron/electron/blob/master/docs/api/browser-window.md#winreload
            });

        }
    }
    /* ------------------- */


    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
        server.close(); // <<<----------------
    })
}

function requestHandler(req, res) {
    var
        file = req.url == '/' ? '/index.html' : req.url,
        // root = __dirname + '/www',
        root = __dirname,
        page404 = root + '/404.html';

    getFile((root + file), res, page404);
}

function getFile(filePath, res, page404) {

    fs.exists(filePath, function(exists) {
        if (exists) {
            fs.readFile(filePath, function(err, contents) {
                if (!err) {
                    res.end(contents);
                } else {
                    console.dir(err);
                }
            });
        } else {
            fs.readFile(page404, function(err, contents) {
                if (!err) {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(contents);
                } else {
                    console.dir(err);
                }
            });
        }
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

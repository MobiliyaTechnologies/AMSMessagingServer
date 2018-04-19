const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const moment = require('moment');
const path = require('path');
const iotHubClient = require('./IoTHub/iot-hub.js');
const socketio = require('socket.io');
var appInsights = require('applicationinsights');
var fs = require('fs');
var _ = require('lodash');
var azure = require('azure');
const app = express();
var socketArr = [];
appInsights.setup("5870db32-0326-4d38-b83c-aa048ee1f0d7").start();
var appInsightClient = appInsights.client;
app.use(express.static(path.join(__dirname, 'public')));
app.use(function (req, res/*, next*/) {
    res.redirect('/');
});
//process.env['CUSTOMCONNSTR_ConnectionString'] = "HostName=AssetIOTHub.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=bkfNOhyF50CeUUjPmd6pqI2spiqXLRvaIqVGh/EOUoo=";
//process.env['CUSTOMCONNSTR_ConsumerGroup'] = "asset_tracking";
const server = http.createServer(app);
var io = require('socket.io')(server);
var iotHubReader;
function connectIOTHub() {
    iotHubReader = new iotHubClient(process.env.CUSTOMCONNSTR_ConnectionString, process.env.CUSTOMCONNSTR_ConsumerGroup);
    iotHubReader.startReadMessage(function (err, obj, date) {
        if (!err) {
            console.log(obj);
            if (obj.SensorRuleId) {
                console.log(obj);
            }
            try {
                date = date || Date.now()
                io.sockets.emit('topic/' + obj.GroupId + '/' + obj.SensorKey, JSON.stringify(Object.assign(obj, { time: moment.utc(date).format('YYYY:MM:DD[T]hh:mm:ss') })));
                io.sockets.emit('topic/' + obj.AssetBarcode, JSON.stringify(Object.assign(obj, { time: moment.utc(date).format('YYYY:MM:DD[T]hh:mm:ss') })));
                if (obj.RSSI) {
                    io.sockets.emit('RSSI', JSON.stringify(Object.assign(obj, { time: moment.utc(date).format('YYYY:MM:DD[T]hh:mm:ss') })));
                }
                if (obj.SensorRuleId) {
                    io.sockets.emit('RuleBreak', JSON.stringify(Object.assign(obj, { time: moment.utc(date).format('YYYY:MM:DD[T]hh:mm:ss') })));
                }
            } catch (err) {
                console.error(err);
                appInsightClient.trackException(err);
            }
        }
        else {
            appInsightClient.trackException(err);
            iotHubReader.close();
            interval = setInterval(function () {
                connectIOTHub();
            }, 10000);
        }
        });

}
connectIOTHub();

var port = normalizePort(process.env.PORT || process.env.port || '3000');
server.listen(port, function listening() {
    console.log('Listening on %d', port);
});

io.on('connection', function (socket) {
    io.sockets.emit('news', { hello: process.env });
    socket.on('my other event', function (data) {
    });
    socket.on('disconnect', function (data) {
    });
});
/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}



var EventHubClient = require('azure-event-hubs').Client;
var Promise = require('bluebird');



//var EventHubConnectionString = 'Endpoint=sb://asseteventhub.servicebus.windows.net/;SharedAccessKeyName=eventhubowner;SharedAccessKey=i2JriA5PRPJTVAH1ahDMlTUWrzHziUagagPSQ8JnEyE=;EntityPath=asseteventhub';
//var EventHubPath = 'asseteventhub';
//var EventHubConnectionString = process.env['CUSTOM_CONNSTR_EventHubConnectionString'];
//var EventHubPath = process.env['CUSTOM_CONNSTR_EventHubPath'];
var EventHubConnectionString = process.env.CUSTOMCONNSTR_EventHubConnectionString;
var EventHubPath = process.env.CUSTOMCONNSTR_EventHubPath;
var sendEvent = function (eventBody) {
    return function (sender) {
        return sender.send(eventBody);
    };
};
var interval;
var printError = function (err) {
    console.error("Event Hub Error ", err);
    appInsightClient.trackException(err);
    client.close();
    //connect();
    interval=setInterval(function () {        
        connect();
    }, 10000);
};

var printEvent = function (ehEvent) {

    if (ehEvent.body.sensorruleid) {
        console.log('Rule Break Event Received: ');
        console.log(JSON.stringify(ehEvent.body));
        io.sockets.emit('RuleBreak', JSON.stringify(Object.assign(ehEvent.body, {})));
    }
    if (ehEvent.body.RuleCreationMessage) {
        console.log('Rule Creation Event Received: ');
        console.log(JSON.stringify(ehEvent.body));
            io.sockets.emit('RuleCreationMessage', JSON.stringify(Object.assign(ehEvent.body, {})));
    }
    if (ehEvent.body.EventHubHealthCheck) {
        console.log('Health Check Message: ');
        console.log(JSON.stringify(ehEvent.body));
        io.sockets.emit('EventHubHealthCheck', JSON.stringify(Object.assign(ehEvent.body, {})));
    }

};
var client;
function connect() {
    client = EventHubClient.fromConnectionString(EventHubConnectionString, EventHubPath);
    var receiveAfterTime = Date.now() - 5000;
   


    client.open()
        .then(function () {
            console.log("Connected to Event Hub ..!!");
            clearInterval(interval);
        })
        .then(client.getPartitionIds.bind(client))
        .then(function (partitionIds) {
                return Promise.map(partitionIds, function (partitionId) {
                return client.createReceiver('$Default', partitionId, { 'startAfterTime': receiveAfterTime }).then(function (receiver) {
                    console.log("Creating Receiver for Partion " + partitionId);
                    receiver.on('errorReceived', printError);
                    receiver.on('message', printEvent);
                });
            }.bind(this));
        }.bind(this))
        .catch(printError);

}
connect();





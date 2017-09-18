const midi = require('midi');
const express = require('express');
const socketio = require('socket.io');
const path = require('path');

const app = express();
const http = require('http').Server(app);
const io =  socketio(http);

const createMidiMessage = (message, deltaTime) => {
  return JSON.stringify({
    message,
    deltaTime
  })
}

app.use(express.static(path.resolve(__dirname, 'dist')));
app.use(express.static(path.resolve(__dirname, 'static')));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  // Set up a new input.
  const input = new midi.input();

  // Count the available input ports.
  input.getPortCount();

  // Get the name of a specified input port.
  input.getPortName(0);

  // Configure a callback.
  input.on('message', (deltaTime, message) => {
    // The message is an array of numbers corresponding to the MIDI bytes:
    //   [status, data1, data2]
    // https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html has some helpful
    // information interpreting the messages.

    io.emit('midi', createMidiMessage(message, deltaTime));
  });

  // Open the first available input port.
  input.openPort(0);

  // Sysex, timing, and active sensing messages are ignored
  // by default. To enable these message types, pass false for
  // the appropriate type in the function below.
  // Order: (Sysex, Timing, Active Sensing)
  // For example if you want to receive only MIDI Clock beats
  // you should use
  // input.ignoreTypes(true, false, true)
  input.ignoreTypes(false, false, false);

  // ... receive MIDI messages ...

  // Close the port when done.
  // input.closePort();

})

http.listen(3000, () => {
  console.log('listening on *:3000');
});

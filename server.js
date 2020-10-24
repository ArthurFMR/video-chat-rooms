const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const path = require('path');
const { ExpressPeerServer } = require('peer');
const formatMessage = require('./utils/messages');
const { userJoin, getRoomUsers, getUser, userLeave } = require('./utils/users');

const exApp = express();
const server = http.createServer(exApp);

const io = socketio(server);


const peerServer = ExpressPeerServer(server, { debug: true });

exApp.use('/peerjs', peerServer)

// set static folder
exApp.use(express.static(path.join(__dirname, 'public')));

const botName = 'Chat Bot'

io.on('connection', socket => {
    socket.on('join-room', ({ id, username, room }) => {
        const user = userJoin(id, username, room);

        socket.join(user.room);

        socket.emit('message', formatMessage(botName, "Welcome to VCR!"));

        // Broadcast when  a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat, be nice with him/her`))

        // Send users and Room info
        io.to(user.room).emit('room-users', {
            room: user.room,
            users: getRoomUsers(user.room)
        })

        // Listen for chatMessage
        socket.on('user-message', msg => {
            const user = getUser(id);
            io.to(user.room).emit('message', formatMessage(user.username, msg));

        });


        // Runs when client disconnects
        socket.on('disconnect', () => {
            const user = userLeave(id);

            if (user) {
                io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));

                // Send users and room info
                io.to(user.room).emit('room-users', {
                    room: user.room,
                    users: getRoomUsers(user.room)
                });
            }
        });

        // Listen to WebcamOn
        socket.on('webcam-on', () =>{
            user.cam = true;
            io.to(user.room).emit('add-webcam-icon', user.id)
        })

        // Listen to webcamOff
        socket.on('webcam-off', () =>{
            user.cam = false
            io.to(user.room).emit('remove-webcam-icon-stream-called', user.id)
        })
    });




});


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on http://127.0.0.1:${PORT}`));
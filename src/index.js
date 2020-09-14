const path = require('path')
const http = require('http')
const express = require('express')
const Filter = require('bad-words')
const app = express()
const server = http.createServer(app)
const { generateMessage, generateLocationMessages } = require('./utils/messages')
const socketio = require('socket.io')
const { SSL_OP_NO_TICKET } = require('constants')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const port = process.env.PORT || 3000
const io = socketio(server)
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))


//let count = 0
io.on('connection', (socket)=> {
    console.log('new web socket connection')

    socket.on('join', ({username, room}, callback)=> {
        const { error, user } = addUser({
            id: socket.id,
            username,
            room
        })

        if(error){
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin','Welcome'))
        socket.broadcast.to(user.room).emit("message", generateMessage('Admin', `${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()

        //socket.emit, io.emit, socket.broadcast.emit
        //io.to.emit socket.broadcast.to.emit
        //io.to.emit()

    })

    socket.on('sendMessage', (msg, callback) => {
        const user = getUser(socket.id)

    const filter= new Filter()
    if(filter.isProfane(msg)){
        return callback('Profanity is not allowed.')
    }

        io.to(user.room).emit('message',generateMessage(user.username, msg))
        callback()
    })

    socket.on('sendLocation', (locationObject, callback) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('locationMessage',generateLocationMessages(user.username, `https://google.com/maps?q=${locationObject.latitude},${locationObject.longitude}`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
    })
    socket.on('disconnect', () => {

        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`))
        }
    })

    // socket.emit('countUpdated', count)
    // socket.on('increment', ()=> {
    //     count++
    //     io.emit('countUpdated', count)
    // })
})

server.listen(port, () => {
    console.log(`Server is up on Port ${port}`)
})
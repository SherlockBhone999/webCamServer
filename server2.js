
const express = require("express")
const app = express()

const http = require('http')
const server = http.createServer(app)
require('dotenv').config()

const port = process.env.PORT
server.listen(port , () => {
  console.log("server listening on port 3000")
})


const io = require("socket.io")(server,{
  cors : {
    origin : ["http://localhost:5173","https://webcam2testr.onrender.com"],
    methods: [ "GET", "POST" ]
  }
})


io.on("connection", socket => {
  socket.on("sendMessage", (message, room ) => {
    if(room !== ""){
      socket.to(room).emit("receiveMessage", message )
    }
  })
  
  socket.on("joinRoom" , (room) => {
    socket.join(room)
  })
  
  /*
  socket.on("joinRoom", (room, cb) => {
    socket.join(room)
    //cb()
  })
  */
})


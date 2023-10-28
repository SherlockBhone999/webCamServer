
const express = require("express")
const app = express()

const http = require('http')
const server = http.createServer(app)
//server = 3000 
const io = require("socket.io")(server, { 
  cors : {
    origin: ["http://localhost:5173", "http://127.0.0.1:8081/_expo/loading","https://webcamreact.onrender.com"],
		methods: [ "GET", "POST" ]
  }
})

require('dotenv').config()

let existingUsers = []
  
io.on("connection", (socket) => {

  socket.on("sendUserInfoToServer", (newUserInfo ) => {
    //update users
    let isAlreadyExist = false
    let indexToReplace = null
    existingUsers.map((user,index) => {
      if(user.socketId === newUserInfo.socketId ){
        isAlreadyExist = true
        indexToReplace = index
      }
    })
    if(!isAlreadyExist){
      existingUsers.push(newUserInfo)
    }else{
      const arr = [...existingUsers]
      arr.splice(indexToReplace, 1, newUserInfo)
      existingUsers = arr
    }
    io.emit("sendUsersToClient", existingUsers )
  })
  
  socket.on("disconnect", () => {
    const disconnectedSocketId = socket.id
    let indexToRemove = null
    existingUsers.map((user,index) => {
      if(user.socketId === disconnectedSocketId ){
        indexToRemove = index
      }
    })
    const arr = [...existingUsers]
    arr.splice( indexToRemove, 1 )
    existingUsers = arr
    io.emit("sendUsersToClient", existingUsers )
  }) 
  
})
  /*
  socket.on("sendDataToServer", (string, id) => {
    console.log("client - ",id , "sent a string to server as follows : ", string )
    
    //send data to all clients
    //io.emit("ServerSendDataToClients", "I like jamelizz" )
    
    //send data to clients except event invoker 
    //socket.broadcast.emit("serverSendDataToClients", "I like Jamelizz") 
    
    //for one to one 
    //socket.to(anothersId).emit("", data)
    
    //to a room 
    //socket.to(roomCanbeanything).emit("", data)
  })
  
  socket.on("joinRoom", (room) => {
    //client got one more prop : room, when socket do socket.to , it will only send data to client with this prop 
    socket.join(room)
  
  })
  */
  
  //with cb 
  //for client 
  //socket.emit("joinRoom", room, (message) => { } )
  //for server 
  /*socket.on("joinRoom", (room, cb) => {
    cb("data for message")
  } )
  */

const port = process.env.PORT
server.listen(port, () => console.log("server is running on port 3000"))



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

let existingDevices = []

io.on("connection", socket => {
  
  socket.on("sendDeviceInfoToServer" , (newDeviceInfo) => {
    const room = newDeviceInfo.roomName
    
    let isAlreadyExist = false
    let indexToReplace = null
    existingDevices.map((deviceInfo,index) => {
      if(deviceInfo.socketId === newDeviceInfo.socketId ){
        isAlreadyExist = true
        indexToReplace = index
      }
    })
    if(!isAlreadyExist){
      existingDevices.push(newDeviceInfo)
    }else{
      const arr = [...existingDevices]
      arr.splice(indexToReplace, 1, newDeviceInfo)
      existingDevices = arr
    }     
    if(room !== ""){
      socket.join(room)
      console.log(`${newDeviceInfo.deviceName} joined ${newDeviceInfo.roomName}`)
      io.to(room).emit("sendAllDevicesToClient", existingDevices )
    }

  })
  

  socket.on("disconnect" , () => {
    const disconnectedSocketId = socket.id
    let indexToRemove = null;
    let disconnectedDeviceInfo = null;
    existingDevices.map((deviceInfo,index) => {
      if(deviceInfo.socketId === disconnectedSocketId ){
        indexToRemove = index;
        disconnectedDeviceInfo = deviceInfo;
      }
    })
    const arr = [...existingDevices]
    arr.splice( indexToRemove, 1 )
    existingDevices = arr
    if(disconnectedDeviceInfo !== null){
      io.to(disconnectedDeviceInfo?.roomName).emit("sendAllDevicesToClient", existingDevices )
      console.log(`${disconnectedDeviceInfo?.deviceName} exited ${disconnectedDeviceInfo?.roomName}`)    
    }
  })
  
  socket.on("orderTakePhoto", deviceInfo => {
    const socketId = deviceInfo.socketId
    io.to(socketId).emit("takePhoto")
    console.log("reach orderTakePhoto"+socketId)
  })
  
  socket.on("orderStartRecording", deviceInfo => {
    const socketId = deviceInfo.socketId
    io.to(socketId).emit("startRecording")
  })
  
})


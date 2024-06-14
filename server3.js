
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
    
    //clean out different roomName devices 
    const arr2 = []
    //must update devices in all other rooms 
    const allOtherRooms = []
    existingDevices.map(deviceInfo => {
      if(deviceInfo.roomName === room){
        arr2.push(deviceInfo)
      }else{
        allOtherRooms.push(deviceInfo.roomName)
      }
    })
    const devicesInTheSameRoom = arr2
    
    allOtherRooms.map(room2 => {
      const temp = []
      existingDevices.map(deviceInfo => {
        if(deviceInfo.roomName === room2){
          temp.push(deviceInfo)
        }
      })
      socket.join(room2)
      io.to(room2).emit("sendAllDevicesToClient", temp )
    })
  
    socket.join(room)
    console.log(`${newDeviceInfo.deviceName} joined ${newDeviceInfo.roomName}`)
    io.to(room).emit("sendAllDevicesToClient", devicesInTheSameRoom )
    

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
    
    const arr2 = []
    const allOtherRooms = []
    existingDevices.map(deviceInfo => {
      if(deviceInfo.roomName === room){
        arr2.push(deviceInfo)
      }else{
        allOtherRooms.push(deviceInfo.roomName)
      }
    })
    const devicesInTheSameRoom = arr2
    
    if(disconnectedDeviceInfo !== null){
      io.to(disconnectedDeviceInfo?.roomName).emit("sendAllDevicesToClient", devicesInTheSameRoom)
      console.log(`${disconnectedDeviceInfo?.deviceName} exited ${disconnectedDeviceInfo?.roomName}`)    
    }
    {/*
    allOtherRooms.map(room2 => {
      const temp = []
      existingDevices.map(deviceInfo => {
        if(deviceInfo.roomName === room2){
          temp.push(deviceInfo)
        }
      })
      io.to(room2).emit("sendAllDevicesToClient", temp )
    })
    */}
  })
  
  
  
  socket.on("orderTakePhoto", deviceInfo => {
    const socketId = deviceInfo.socketId
    io.to(socketId).emit("takePhoto")
  })
  
  socket.on("orderStartRecording", deviceInfo => {
    const socketId = deviceInfo.socketId
    io.to(socketId).emit("startRecording")
  })
  
})


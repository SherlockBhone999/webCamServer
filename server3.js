
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
    origin : ["http://localhost:5173","https://webcam2testr.onrender.com","https://webcam-pc1u.onrender.com"],
    methods: [ "GET", "POST" ]
  }
})

var existingDevices = []

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
    io.to(room).emit("sendAllDevicesToClient", devicesInTheSameRoom )
    

  })
  

  socket.on("disconnecting" , () => {

    const disconnectedSocketId = socket.id 
    let disconnectedDeviceInfo = null;
    const remainingDevices = []
    existingDevices.map(obj => {
      if(obj.socketId === disconnectedSocketId){
        disconnectedDeviceInfo = obj
      }else{
        remainingDevices.push(obj)
      }
    })
    existingDevices = remainingDevices
   
    const remainingDevicesInTheRoom = []
    const room = disconnectedDeviceInfo?.roomName 
    
    remainingDevices.map(obj => {
      if(obj.roomName === room ){
        remainingDevicesInTheRoom.push(obj)
      }
    })
   
   socket.join(room)
   io.to(room).emit("sendAllDevicesToClient", remainingDevicesInTheRoom)
   
  })
  
   
  
  socket.on("orderCapturePhoto", (twoDevices) => {
    const senderId = twoDevices.sender.socketId
    io.to(senderId).emit("capturePhoto", twoDevices )

  })
  
  socket.on("orderStartRecording", (senderId) => {
    io.to(senderId).emit("startRecording")
    
  })
  
  socket.on("orderStopRecording", (twoDevices) => {
    const senderId = twoDevices.sender.socketId
    io.to(senderId).emit("stopRecording", twoDevices )
  })
  
  socket.on("orderTurnCamera" , (sender) => {
    const senderId = sender.socketId
    const senderFacingMode = sender.facingMode;
    io.to(senderId).emit("turnCamera", senderFacingMode)
  })
  
  socket.on("feedbackPhotoSaved" , (twoDevices) => {
      const senderName = twoDevices.sender.deviceName 
      const receiverId = twoDevices.receiver.socketId
      const message = `${senderName} saved a photo`
    io.to(receiverId).emit("displayFeedback", message )
  }) 
  
  socket.on("feedbackVideoSaved" , (twoDevices) => {
      const senderName = twoDevices.sender.deviceName 
      const receiverId = twoDevices.receiver.socketId
      const message = `${senderName} saved a video`
    io.to(receiverId).emit("displayFeedback", message )
  })
  
  socket.on("orderClosePeerConnection", (senderId) => {
    io.to(senderId).emit("closePeerConnection")
  })
  
  socket.on("cameraIsSwitching" , (receiverId) => {
    io.to(receiverId).emit("showLoading")
  })
  
})





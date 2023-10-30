const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const bodyParser = require('body-parser');
const dotenv = require("dotenv");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");
const {chats} = require("./data/data");
const {Socket} = require('socket.io')
import { Server } from "socket.io";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

const PORT = process.env.PORT ||5000;

const server = app.listen(
  PORT,
  console.log(`Server running on PORT ${PORT}...`.yellow.bold)
);

if(server){
  console.log("Success".green.bold);
}


app.get("/", (req, res) => {
  res.send("Api is running");
});

app.use("/chat/api/chat",chatRoutes);
app.use("/chat/api/message",messageRoutes); 

app.use(notFound);
app.use(errorHandler);

// const io = require('socket.io')(server,{
//   pingTimeout:60000,
//   cors:{
//       origin:["http://localhost:3003", "https://manage-dev.edfoci.com"], 
//   },
// })

const io = new Server(server);

io.on("connection",(Socket) =>{
  console.log('Connected to socket.io');

  Socket.on("setup",(userData) =>{
    Socket.join(String(userData.lg_user_id));
    console.log(typeof userData.lg_user_id);
    Socket.emit('connected');
  });

  Socket.on('join chat',(room)=>{
      Socket.join(room);
      console.log("user jointed room "+room);
  });

  Socket.on('typing',(room)=>Socket.in(room).emit("typing"));

  Socket.on('stop typing',(room)=>Socket.in(room).emit("stop typing"));
  
  Socket.on("new message",(newMessageReceived)=>{

    var chat = newMessageReceived.chat;

    if(!chat.users) return console.log('chat.users not defined');

    chat.users.forEach(user => {

      //if(user == newMessageReceived.sender) return;
      console.log(typeof user);
      Socket.in(user).emit("message received", newMessageReceived)

    });
    
  });

  Socket.off("setup",()=>{
    console.log("USER DISCONNECTED").red.bold;
    Socket.leave(userData.lg_user_id)
  })
});
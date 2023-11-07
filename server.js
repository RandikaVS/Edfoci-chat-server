const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const bodyParser = require('body-parser');
const dotenv = require("dotenv");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

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


app.use("/chat/api/chat",chatRoutes);
app.use("/chat/api/message",messageRoutes); 

app.use(notFound);
app.use(errorHandler);

const io = require('socket.io')(server,{
  pingTimeout:60000,
  cors:{
      origin:["http://localhost:3003", "https://manage-dev.edfoci.com"], 
  },
})


io.on("connection",(Socket) =>{

  try {
    Socket.on("setup",(userData) =>{
      Socket.join(String(userData.lg_user_id));
      Socket.emit('connected');
    })
  }
  catch(error){
    console.log(error);
  }

  try{
    Socket.on('join chat',(room)=>{
      Socket.join(room);
    });
  }
  catch(error){
    console.log(error);
  }
  
try{
  Socket.on('typing',(room,currentUser)=>{
    Socket.in(room).emit("typing",currentUser.name)
  })

  Socket.on('stop typing',(room)=>{
    Socket.in(room).emit("stop typing")
  });
}
catch(error){
  console.log(error);
}
  
try{
  Socket.on("new message",(newMessageReceived)=>{
    var chat = newMessageReceived.chat;

    if(!chat.users) return console.log('chat.users not defined');

    chat.users.forEach(user => {
      if(user.lg_user_id == newMessageReceived.sender.lg_user_id && user.lg_user_table_id == newMessageReceived.sender.lg_user_table_id) return;
      Socket.in(user.lg_user_id).emit("message received", newMessageReceived)
    });
    
  });
}catch(error){
  console.log(error);
}

  Socket.off("setup",()=>{
    console.log("USER DISCONNECTED").red.bold;
    Socket.leave(userData.lg_user_id)
  })
});
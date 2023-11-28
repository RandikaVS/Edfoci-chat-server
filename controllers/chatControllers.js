const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");
const Message = require("../models/messageModel")

//@description     Create or fetch One to One Chat
//@route           POST /api/chat/
//@access          Protected
const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    console.log("UserId param not sent with request");
    return res.sendStatus(400);
  }

  var isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users")
    .populate("latestMessage");

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    var chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };

    try {
      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      res.status(200).json(FullChat);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }
});

//@description     Fetch all chats for a user
//@route           GET /api/chat/
//@access          Protected
const fetchChats = asyncHandler(async (req, res) => {
  const {userId} = req.query;
  try {

    Chat.find({ users: { $elemMatch: { $eq: userId}}})
    .populate ("users")
    .populate("latestMessage")

    .sort( {updateAt: -1 } )

    .then(async(results)=>{

        res.status(200).send(results);
        console.log(results);
        console.log("success load the chats".green.bold);
    });

} catch (error) {
    console.log("fail to load the chats".red.bold);
    res.status(400);
    throw new Error (error.message);
    
}
});

const fetchChatByChatId = asyncHandler(async (req, res) => {
  const {chatId} = req.params;
  try {

    Chat.findOne({ _id: chatId })
    .populate("latestMessage")
    .then(async(results)=>{
      if (!results) {
        // Chat not found, return a 404 response
        return res.status(404).json({ message: "Chat not found" });
      }
      // Chat found, return a 200 response with the chat data
      res.status(200).json(results);
    })
    .catch((error) => {
      res.status(500).json({ message: "Internal server error" });
    });

} catch (error) {
    console.log("fail to load the chats".red.bold);
    res.status(400);
    throw new Error (error.message);
    
}
});

//@description     Create New Group Chat
//@route           POST /api/chat/group
//@access          Protected
const createGroupChat = asyncHandler(async (req, res) => {

  const{chatName,users,groupAdmin} = req.body;

  if (!users || !groupAdmin || !chatName) {
    return res.status(400).send({ message: "Please Fill all the feilds" });
  }
  // var users = JSON.parse(req.body.users);

  if (users.length < 2) {
    return res
      .status(400)
      .send("More than 2 users are required to form a group chat");
  }

  try {
    const groupChat = await Chat.create({
      chatName: chatName,
      users: users,
      isGroupChat: true,
      groupAdmin: groupAdmin,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Rename Group
// @route   PUT /api/chat/rename
// @access  Protected
const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      chatName: chatName,
    },
    {
      new: true,
    }
  ).populate("latestMessage")

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(updatedChat);
  }
});

// @desc    Remove user from Group
// @route   PUT /api/chat/groupremove
// @access  Protected
const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;
  // check if the requester is admin

  const removed = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: { _id: { $in: userId } } }
    },
    {
      multi: true,
      new: true,
    }
  ).populate("latestMessage")

  if (!removed) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(removed);
  }
});

// @desc    Add user to Group / Leave
// @route   PUT /api/chat/groupadd
// @access  Protected
const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;
  // check if the requester is admin

  const added = await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: { users: Array.isArray(userId) ? userId : [userId] },
    },
    {
      new: true,
    }
  ).populate("latestMessage")

  if (!added) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(added);
  }
});

const syncNameWithChat = asyncHandler(async(req,res)=>{

  const { userId,tableId,newName } = req.body;
console.log( userId,tableId,newName);
  try{
    // Update name in the Chat model
    await Chat.updateMany(
      { users: { $elemMatch: { lg_user_id: userId, lg_user_table_id: tableId } } },
      { $set: { "users.$.name": newName } }
    );

    // Update group admin name in the Chat model
    await Chat.updateMany(
      { "groupAdmin.lg_user_id": userId, "groupAdmin.lg_user_table_id": tableId },
      { $set: { "groupAdmin.name": newName } }
    );

    // Update name in the Message model (sender field)
    await Message.updateMany(
      { "sender.lg_user_id": userId, "sender.lg_user_table_id": tableId },
      { $set: { "sender.name": newName } }
    );

    // Update name in the Message model (readBy array)
    await Message.updateMany(
      { "readBy.lg_user_id": userId, "readBy.lg_user_table_id": tableId },
      { $set: { "readBy.$.name": newName } }
    );
    res.status(200).json({ success: true, message: "User name updated successfully." });
  }
  catch(error){
    res.status(500).json({ success: false, message: "Internal server error" });
  }
})

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  fetchChatByChatId,
  syncNameWithChat
};
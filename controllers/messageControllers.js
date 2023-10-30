const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");

//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("chat");
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId,userId } = req.body;

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  var newMessage = {
    sender: userId,
    content: content,
    chat: chatId,
  };
  var message;
  try {
    message = await Message.create(newMessage);

    message = await message.populate("chat");

    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });
    res.json(message);

  } catch (error) {
    if(message)
      await Message.findByIdAndDelete(message._id);

    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = { allMessages, sendMessage };
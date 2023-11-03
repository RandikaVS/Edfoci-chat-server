const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    sender: { 
      name:{type:String},
      lg_user_id: { type: String },
      lg_user_table_id: { type: String }
    },
    content: { type: String, trim: true },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    readBy: [
      {
        name:{type:String},
        lg_user_id: { type: String },
        lg_user_table_id: { type: String }
      }
    ],
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
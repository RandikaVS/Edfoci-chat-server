const express = require("express");
const {
  accessChat,
  fetchChats,
  createGroupChat,
  removeFromGroup,
  addToGroup,
  renameGroup,
  fetchChatByChatId,
  syncNameWithChat
} = require("../controllers/chatControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").post(accessChat);
router.route("/").get(fetchChats);
router.route("/getChat/:chatId").get(fetchChatByChatId);
router.route("/group").post(createGroupChat);
router.route("/rename").put(renameGroup);
router.route("/groupremove").put(removeFromGroup);
router.route("/groupadd").put(addToGroup);
router.route("/sync-userName").put(syncNameWithChat);

module.exports = router;
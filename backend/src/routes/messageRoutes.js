const express = require("express");
const router = express.Router();
const messageCtrl = require("../controllers/messageController");

router.post("/send", messageCtrl.sendMessage);
router.get("/inbox", messageCtrl.getInbox);
router.get("/thread/:userId", messageCtrl.getThread);
router.post("/mark-read", messageCtrl.markAsRead);
router.get("/contacts", messageCtrl.getContacts);

// ✅ FIXED DELETE ROUTE
router.delete("/conversation/:userId", messageCtrl.deleteConversation);

module.exports = router;
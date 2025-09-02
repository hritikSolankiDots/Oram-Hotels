const express = require("express");
const { getTicketStatusList, getTicketsByEmployee, getTicketDetail, updateTicketStatusAndNote } = require("../controllers/ticketController");
const multer = require("multer");
const router = express.Router();

const upload = multer(); 

router.get("/status-list", getTicketStatusList);
router.get("/employee/:employeeId", getTicketsByEmployee);
router.get("/:ticketId", getTicketDetail);
router.post("/:ticketId/update", upload.single("file"), updateTicketStatusAndNote);

module.exports = router;

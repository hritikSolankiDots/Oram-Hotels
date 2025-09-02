
const { getStatusLabel } = require("../config/ticketStatusConfig");
const Ticket = require("../models/Ticket");
const { getTicketPipelineStages, updateHubspotTicketStatus, createHubspotNote, associateNoteToTicket, uploadFileToHubspot } = require("../services/hubspotService");

// GET /tickets/status-list
exports.getTicketStatusList = async (req, res) => {
  try {
    const stages = await getTicketPipelineStages();

    return res.json({
      success: true,
      message: "Ticket status list fetched successfully",
      data: stages, // ✅ return inside data
    });
  } catch (error) {
    console.error("Error fetching ticket status list:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch ticket status list",
      error: error.message,
    });
  }
};


// GET /tickets/employee/:employeeId
exports.getTicketsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!employeeId) { 
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // total count for pagination
    const totalTickets = await Ticket.countDocuments({ assignedTo: employeeId });

    let tickets = await Ticket.find({ assignedTo: employeeId })
      .sort({ createdAt: -1 }) // latest first
      .skip(skip)
      .limit(parseInt(limit));

    // map statusId → statusLabel
    tickets = tickets.map((ticket) => {
      const ticketObj = ticket.toObject();
      ticketObj.statusLabel = getStatusLabel(ticketObj.status);
      return ticketObj;
    });

    return res.json({
      success: true,
      message: "Tickets fetched successfully",
      pagination: {
        total: totalTickets,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalTickets / limit),
      },
      data: tickets,
    });
  } catch (error) {
    console.error("Error fetching tickets:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch tickets",
      error: error.message,
    });
  }
};


// GET /tickets/:ticketId 
exports.getTicketDetail = async (req, res) => {
  try {
    const { ticketId } = req.params;

    if (!ticketId) {
      return res.status(400).json({
        success: false,
        message: "Ticket ID is required",
      });
    }

    let ticket = await Ticket.findById(ticketId).populate("assignedTo", "name email");

    // map statusId → statusLabel
    if (ticket) {
      const ticketObj = ticket.toObject();
      ticketObj.statusLabel = getStatusLabel(ticketObj.status);
      ticket = ticketObj;
    }

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    return res.json({
      success: true,
      message: "Ticket fetched successfully",
      data: ticket,
    });
  } catch (error) {
    console.error("Error fetching ticket detail:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch ticket detail",
      error: error.message,
    });
  }
};


// PUT /tickets/:ticketId/update
exports.updateTicketStatusAndNote = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, noteMessage, employeeId } = req.body;

    if (!status && !noteMessage && !req.file) {
      return res.status(400).json({
        success: false,
        message: "Nothing to update",
      });
    }

    // 1. Find ticket
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // 2. Update status in HubSpot
    if (status) {
      await updateHubspotTicketStatus(ticket.hubspotTicketId, status);
      ticket.status = status;
    }

    // 3. Handle file upload when status = 4
    if (status == 4 && req.file) {
      const uploadedFile = await uploadFileToHubspot(req.file);

      // Note content
      const noteContent = noteMessage || "File attached";

      const hubspotNoteId = await createHubspotNote(noteContent, uploadedFile.id);
      await associateNoteToTicket(hubspotNoteId, ticket.hubspotTicketId);

      // Save file + note in DB
      ticket.attachments.push({
        hubspotFileId: uploadedFile.id,
        url: uploadedFile.url,
        fileName: req.file.originalname,
      });

      ticket.notes.push({
        hubspotNoteId,
        message: noteContent,
        attachmentUrl: uploadedFile.url,
        addedBy: employeeId,
      });
    } else if (noteMessage) {
      // 4. Add note without file
      const hubspotNoteId = await createHubspotNote(noteMessage);
      await associateNoteToTicket(hubspotNoteId, ticket.hubspotTicketId);

      ticket.notes.push({
        hubspotNoteId,
        message: noteMessage,
        addedBy: employeeId,
      });
    }

    await ticket.save();

    return res.json({
      success: true,
      message: "Ticket updated successfully",
      data: ticket,
    });
  } catch (error) {
    console.error("Error updating ticket:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "Error updating ticket",
      error: error.response?.data || error.message,
    });
  }
};

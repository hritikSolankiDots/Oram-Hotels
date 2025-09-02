const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: Number,
      enum: [1, 2, 3, 4],
      default: 1,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    hubspotTicketId: {
      type: String, 
      required: true,
    },
    attachmentLink: {
      type: String, 
    },
    attachments: [
      {
        hubspotFileId: { type: String },
        url: { type: String },
        fileName: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    notes: [
      {
        hubspotNoteId: { type: String }, 
        message: { type: String },
        attachmentUrl: { type: String },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Ticket = mongoose.model('Ticket', ticketSchema);
module.exports = Ticket;

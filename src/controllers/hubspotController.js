const hubspotService = require('../services/hubspotService');
const Employee = require('../models/Employee');
const Ticket = require('../models/Ticket');
const { default: mongoose } = require('mongoose');

const getTicketById = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { ticketId } = req.params;
    if (!ticketId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'ticketId param is required' });
    }

    // 1) Fetch HubSpot ticket (read-only)
    const hsTicket = await hubspotService.getTicketById(ticketId);
    if (!hsTicket || !hsTicket.id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: `HubSpot ticket ${ticketId} not found` });
    }

    const properties = hsTicket.properties || {};
    const ownerId = properties.hubspot_owner_id ?? properties.ownerId ?? properties.owner ?? null;
    const title = properties.subject || properties.title || `HS Ticket ${hsTicket.id}`;
    const description = properties.content || properties.description || 'Test description';
    const status = properties.hs_pipeline_stage || 'new';

    // 2) Find employees for ownerId
    let employees = [];
    if (ownerId) {
      employees = await Employee.find({ ownerId: String(ownerId) }).select('-password').session(session);
    }
    console.log(`Found ${employees.length} employees for ownerId ${ownerId}`);

    // 3) Check idempotency: does a local ticket for this hubspotTicketId already exist?
    let localTicket = await Ticket.findOne({ hubspotTicketId: String(hsTicket.id) }).session(session);
    if (localTicket) {
      // If exists, just populate assignedTo and return current state + hubspot and employees
      const populated = await Ticket.findById(localTicket._id).populate('assignedTo', '-password');
      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({
        message: 'Local ticket already exists',
        hubspot: hsTicket,
        employees,
        ticket: populated,
      });
    }
    // 4) No local ticket -> create one and assign an employee (if employees exist)
    let assignedEmployee = null;
    if (employees.length > 0) {
      // Least-busy strategy: count open + in progress per employee
      const employeeIds = employees.map(e => e._id);

      const counts = await Ticket.aggregate([
        { $match: { assignedTo: { $in: employeeIds }, status: { $in: ['open', 'in progress'] } } },
        { $group: { _id: '$assignedTo', count: { $sum: 1 } } }
      ]).session(session);

      const countMap = new Map();
      employeeIds.forEach(id => countMap.set(String(id), 0));
      counts.forEach(c => countMap.set(String(c._id), c.count));

      // sort employees by load then by creation time as tiebreaker
      employees.sort((a, b) => {
        const ca = countMap.get(String(a._id)) || 0;
        const cb = countMap.get(String(b._id)) || 0;
        if (ca !== cb) return ca - cb;
        // tiebreaker: earlier created wins (if createdAt not present, use ObjectId timestamp)
        const at = a.createdAt ? new Date(a.createdAt) : a._id.getTimestamp();
        const bt = b.createdAt ? new Date(b.createdAt) : b._id.getTimestamp();
        return at - bt;
      });

      assignedEmployee = employees[0];
    }

    // 5) Create ticket locally
    const newTicket = new Ticket({
      title,
      description,
      status,
      assignedTo: assignedEmployee ? assignedEmployee._id : undefined,
      hubspotTicketId: String(hsTicket.id),
    });

    await newTicket.save({ session });

    // commit
    await session.commitTransaction();
    session.endSession();

    const populatedTicket = await Ticket.findById(newTicket._id).populate('assignedTo', '-password');
    return res.status(201).json({
      message: 'Local ticket created and assigned (if employees found)',
      hubspot: hsTicket,
      employees,
      ticket: populatedTicket,
    });

  } catch (err) {
    console.error('getTicketById handler error:', err);
    try { await session.abortTransaction(); } catch (e) { console.error('abort failed', e); }
    session.endSession();
    return res.status(500).json({ message: 'Failed processing ticket', error: err.message });
  }
};

module.exports = {
  getTicketById,
};
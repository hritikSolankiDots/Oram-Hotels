// config/ticketStatusConfig.js
const TICKET_STATUS = [
  { id: 1, label: "New" },
  { id: 2, label: "Waiting on contact" },
  { id: 3, label: "Waiting on us" },
  { id: 4, label: "Closed" },
];

// helper to get label by id
const getStatusLabel = (id) => {
  const status = TICKET_STATUS.find((s) => s.id === id);
  return status ? status.label : "Unknown";
};

module.exports = { TICKET_STATUS, getStatusLabel };

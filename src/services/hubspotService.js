const axios = require('axios');
const { hubspotApiKey } = require('../config');
const FormData = require("form-data");

const hubspotApi = axios.create({
  baseURL: 'https://api.hubapi.com',
  headers: {
    Authorization: `Bearer ${hubspotApiKey}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Fetches contacts from the HubSpot API.
 * @returns {Promise<Array>} A promise that resolves to an array of contacts.
 */
const getContacts = async () => {
  try {
    const response = await hubspotApi.get('/crm/v3/objects/contacts');
    return response.data.results;
  } catch (error) {
    console.error('Error fetching HubSpot contacts:', error.response ? error.response.data : error.message);
    throw new Error('Failed to fetch contacts from HubSpot');
  }
};

/**
 * Fetches a single ticket from the HubSpot API by its ID.
 * @param {string} ticketId - The ID of the ticket to fetch.
 * @returns {Promise<object>} A promise that resolves to the ticket object.
 */
const getTicketById = async (ticketId) => {
  try {
    const response = await hubspotApi.get(`/crm/v3/objects/tickets/${ticketId}?properties=hubspot_owner_id,content,subject,hs_pipeline_stage`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching HubSpot ticket ${ticketId}:`, error.response ? error.response.data : error.message);
    throw new Error(`Failed to fetch ticket ${ticketId} from HubSpot`);
  }
};

/**
 * Fetches a single owner from the HubSpot API by its ID.
 * @param {string} ownerId - The ID of the owner to fetch.
 * @returns {Promise<object>} A promise that resolves to the owner object.
 */
const getOwnerById = async (ownerId) => {
  try {
    const response = await hubspotApi.get(`/crm/v3/owners/${ownerId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching HubSpot owner ${ownerId}:`, error.response ? error.response.data : error.message);
    throw new Error(`Failed to fetch owner ${ownerId} from HubSpot`);
  }
};

const createTicket = async (ticketData) => {
  try {
    const response = await hubspotApi.post('/crm/v3/objects/tickets', ticketData);
    return response.data;
  } catch (error) {
    console.error('Error creating HubSpot ticket:', error.response ? error.response.data : error.message);
    throw new Error('Failed to create ticket in HubSpot');
  }
};

const updateTicket = async (ticketId, ticketData) => {
  try {
    const response = await hubspotApi.patch(`/crm/v3/objects/tickets/${ticketId}`, ticketData);
    return response.data;
  } catch (error) {
    console.error(`Error updating HubSpot ticket ${ticketId}:`, error.response ? error.response.data : error.message);
    throw new Error(`Failed to update ticket ${ticketId} in HubSpot`);
  }
};


const getTicketPipelineStages = async () => {
  try {
    // 1. Get pipelines
    const { data: pipelines } = await hubspotApi.get("/crm/v3/pipelines/tickets");

    if (!pipelines.results.length) {
      throw new Error("No ticket pipelines found");
    }

    // 2. Pick the first pipeline (default one)
    const pipelineId = pipelines.results[0].id;

    // 3. Get stages of that pipeline
    const { data: stages } = await hubspotApi.get(
      `/crm/v3/pipelines/tickets/${pipelineId}/stages`
    );

    // 4. Format response
    return stages.results.map((stage) => ({
      id: stage.id,
      label: stage.label,
    }));
  } catch (error) {
    console.error(
      "Error fetching HubSpot ticket pipeline stages:",
      error.response ? error.response.data : error.message
    );
    throw new Error("Failed to fetch ticket pipeline stages from HubSpot");
  }
};

/**
 * Update HubSpot Ticket Status
 */
const updateHubspotTicketStatus = async (ticketId, status) => {
  try {
    await hubspotApi.patch(`/crm/v3/objects/tickets/${ticketId}`, {
      properties: { hs_pipeline_stage: String(status) },
    });
    return { success: true };
  } catch (error) {
    throw new Error(
      `HubSpot Ticket Update Failed: ${error.response?.data?.message || error.message}`
    );
  }
};

/**
 * Create a HubSpot Note
 */
const createHubspotNote = async (noteContent, fileId) => {
  try {
    const { data: note } = await hubspotApi.post("/crm/v3/objects/notes", {
      properties: {
        hs_note_body: noteContent,
        hs_timestamp: new Date().toISOString(),
        hs_attachment_ids: fileId
      },
    });

    if (!note?.id) {
      throw new Error("HubSpot did not return note ID");
    }

    return note.id;
  } catch (error) {
    throw new Error(
      `HubSpot Note Creation Failed: ${error.response?.data?.message || error.message}`
    );
  }
};




/**
 * Associate Note with HubSpot Ticket
 */
const associateNoteToTicket = async (noteId, ticketId) => {
  try {
    await hubspotApi.put(
      `/crm/v3/objects/notes/${noteId}/associations/tickets/${ticketId}/note_to_ticket`,
      {}
    );
    return { success: true };
  } catch (error) {
    throw new Error(
      `HubSpot Note Association Failed: ${error.response?.data?.message || error.message}`
    );
  }
};

async function uploadFileToHubspot(file) {
  try {
    const formData = new FormData();
    formData.append("file", file.buffer, file.originalname);
    formData.append("folderPath", "/uploads/tickets");
    formData.append(
      "options",
      JSON.stringify({ access: "PUBLIC_NOT_INDEXABLE" })
    );

    const { data } = await hubspotApi.post(
      "/filemanager/api/v3/files/upload",
      formData,
      { headers: formData.getHeaders() }
    );

    return data.objects[0]; // contains fileId, url, etc.
  } catch (error) {
    console.error("Error uploading file to HubSpot:", error);
    throw new Error("Failed to upload file to HubSpot");
  }
}

module.exports = {
  hubspotApi,
  getContacts,
  getTicketById,
  getOwnerById,
  createTicket,
  updateTicket,
  getTicketPipelineStages,
  updateHubspotTicketStatus,
  createHubspotNote,
  associateNoteToTicket,
  uploadFileToHubspot,
};
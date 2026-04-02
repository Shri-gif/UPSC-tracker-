// app.js
import { supabase, getAllData, insertData, updateData, deleteData, getDataById } from './db.js';

// Your specific table name
const TABLE_NAME = 'entries';

// DOM elements for your specific form fields
const addForm = document.getElementById('addForm');
const dataList = document.getElementById('dataList');
const formInputs = {
  entryDate: document.getElementById("entryDate"),
  gsHours: document.getElementById("gsHours"),
  csatHours: document.getElementById("csatHours"),
  optionalHours: document.getElementById("optionalHours"),
  currentAffairs: document.getElementById("currentAffairs"),
  revisionHours: document.getElementById("revisionHours"),
  mockHours: document.getElementById("mockHours"),
};

// Initialize app
async function init() {
  await loadData();
  setupEventListeners();
}

// Load all entries from table
async function loadData() {
  const data = await getAllData(TABLE_NAME);
  if (data) {
    displayData(data);
  }
}

// Display entries data in HTML
function displayData(entries) {
  if (dataList) {
    dataList.innerHTML = entries.map(entry => `
      <div class="entry-item" data-id="${entry.id}">
        <h3>Date: ${new Date(entry.date).toLocaleDateString()}</h3>
        <div class="entry-details">
          <p><strong>GS Hours:</strong> ${entry.gsHours || 0}h</p>
          <p><strong>CSAT Hours:</strong> ${entry.csatHours || 0}h</p>
          <p><strong>Optional Hours:</strong> ${entry.optionalHours || 0}h</p>
          <p><strong>Current Affairs:</strong> ${entry.currentAffairs || 0}h</p>
          <p><strong>Revision Hours:</strong> ${entry.revisionHours || 0}h</p>
          <p><strong>Mock Hours:</strong> ${entry.mockHours || 0}h</p>
        </div>
        <div class="entry-actions">
          <button onclick="editEntry('${entry.id}')" class="edit-btn">Edit</button>
          <button onclick="deleteEntry('${entry.id}')" class="delete-btn">Delete</button>
        </div>
      </div>
    `).join('');
  }
}

// Add new entry (YOUR SPECIFIC CODE INTEGRATED)
async function addEntry(e) {
  e.preventDefault();
  
  // Get current user (you'll need to implement auth)
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    alert('Please log in first!');
    return;
  }

  const newEntry = {
    user_id: user.id,
    date: document.getElementById("entryDate").value,
    gsHours: parseFloat(document.getElementById("gsHours").value) || 0,
    csatHours: parseFloat(document.getElementById("csatHours").value) || 0,
    optionalHours: parseFloat(document.getElementById("optionalHours").value) || 0,
    currentAffairs: parseFloat(document.getElementById("currentAffairs").value) || 0,
    revisionHours: parseFloat(document.getElementById("revisionHours").value) || 0,
    mockHours: parseFloat(document.getElementById("mockHours").value) || 0,
  };

  const result = await supabase
    .from('entries')
    .insert([newEntry])
    .select()
    .single();

  if (result.data) {
    // Reset form
    document.getElementById("entryDate").value = '';
    document.getElementById("gsHours").value = '';
    document.getElementById("csatHours").value = '';
    document.getElementById("optionalHours").value = '';
    document.getElementById("currentAffairs").value = '';
    document.getElementById("revisionHours").value = '';
    document.getElementById("mockHours").value = '';
    
    loadData(); // Refresh data
    alert('Entry added successfully!');
  } else {
    console.error(result.error);
    alert('Error adding entry: ' + result.error.message);
  }
}

// Edit entry
window.editEntry = async function(id) {
  const entry = await getDataById(TABLE_NAME, id);
  if (entry) {
    // Populate form with entry data
    document.getElementById("entryDate").value = entry.date;
    document.getElementById("gsHours").value = entry.gsHours || '';
    document.getElementById("csatHours").value = entry.csatHours || '';
    document.getElementById("optionalHours").value = entry.optionalHours || '';
    document.getElementById("currentAffairs").value = entry.currentAffairs || '';
    document.getElementById("revisionHours").value = entry.revisionHours || '';
    document.getElementById("mockHours").value = entry.mockHours || '';
    
    // Switch to edit mode (you can implement update button toggle here)
    alert('Edit mode: Update the form and click "Update Entry"');
  }
};

// Update entry (call this after editing)
window.updateEntry = async function(id) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const updatedEntry = {
    user_id: user.id,
    date: document.getElementById("entryDate").value,
    gsHours: parseFloat(document.getElementById("gsHours").value) || 0,
    csatHours: parseFloat(document.getElementById("csatHours").value) || 0,
    optionalHours: parseFloat(document.getElementById("optionalHours").value) || 0,
    currentAffairs: parseFloat(document.getElementById("currentAffairs").value) || 0,
    revisionHours: parseFloat(document.getElementById("revisionHours").value) || 0,
    mockHours: parseFloat(document.getElementById("mockHours").value) || 0,
  };

  const result = await updateData(TABLE_NAME, id, updatedEntry);
  if (result) {
    // Reset form
    resetForm();
    loadData();
    alert('Entry updated successfully!');
  }
};

// Delete entry
window.deleteEntry = async function(id) {
  if (confirm('Are you sure you want to delete this entry?')) {
    const success = await deleteData(TABLE_NAME, id);
    if (success) {
      loadData();
      alert('Entry deleted successfully!');
    }
  }
};

// Reset form
function resetForm() {
  document.getElementById("entryDate").value = '';
  document.getElementById("gsHours").value = '';
  document.getElementById("csatHours").value = '';
  document.getElementById("optionalHours").value = '';
  document.getElementById("currentAffairs").value = '';
  document.getElementById("revisionHours").value = '';
  document.getElementById("mockHours").value = '';
}

// Setup event listeners
function setupEventListeners() {
  if (addForm) {
    addForm.addEventListener('submit', addEntry);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Export functions for global use
window.loadData = loadData;
window.resetForm = resetForm;

const fs = require('fs');

const sheet1 = JSON.parse(fs.readFileSync('sheet1.json', 'utf8'));
const sheet2 = JSON.parse(fs.readFileSync('sheet2.json', 'utf8'));

const headers = sheet1[0];
const clientNameIdx = headers.indexOf("Client's Name");
const serviceLineIdx = headers.indexOf('Service Line');

const excludedClients = ["C_Forward_PXL Sales", "special_PXL Sales"];
const excludedServices = ["Social Media Design", "Logo Design", "Packaging Design", "Book Cover Design", "Presentation Design", "UIUX Design"];

const clients = new Set();
const clientList = [];

function processRow(row) {
  if (!row || row.length <= Math.max(clientNameIdx, serviceLineIdx)) return;
  
  const clientName = row[clientNameIdx]?.trim();
  const serviceLine = row[serviceLineIdx]?.trim();
  
  if (!clientName) return;
  
  if (excludedClients.includes(clientName)) return;
  
  // Exclude specified services
  if (excludedServices.includes(serviceLine)) return;
  
  if (!clients.has(clientName)) {
    clients.add(clientName);
    clientList.push(clientName);
  }
}

// Process sheet 1, skipping header
for (let i = 1; i < sheet1.length; i++) {
  processRow(sheet1[i]);
}

// Process sheet 2, skipping header
for (let i = 1; i < sheet2.length; i++) {
  processRow(sheet2[i]);
}

clientList.sort();

const output = clientList.join('\n');
fs.writeFileSync('extracted_clients.txt', output);
console.log(`Extracted ${clientList.length} unique clients.`);

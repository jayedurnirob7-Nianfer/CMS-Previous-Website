fetch('https://script.google.com/macros/s/AKfycbzQTOF3LNIr3wOyvEzNvlUMXa3PeWQl80tHlwaqYnXf1rRF09BLAO8VydmmARi8XdxniA/exec', {
  method: 'POST',
  body: JSON.stringify({
    "action": "update",
    "rowIndex": 1,
    "oldSheet": "Wordpress",
    "Risk Management/IT / Government Contracting / AI": "Type of website",
    "": "Profile Name",
    "chriscodle": "Client Name",
    "https://...": "Our Domain",
    "https://www.resolutesolns.com/": "Client Website",
    "Tactical, Mission Ready, Combat, Militery, SAP test automation, Fl": "Tags",
    "Good": "Status",
    "Eclipse_PXL": "Team Name",
    "e.g. John Doe": "Developer"
  })
}).then(res => res.json()).then(console.log).catch(console.error);

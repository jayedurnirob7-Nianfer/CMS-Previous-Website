fetch('https://script.google.com/macros/s/AKfycbzQTOF3LNIr3wOyvEzNvlUMXa3PeWQl80tHlwaqYnXf1rRF09BLAO8VydmmARi8XdxniA/exec', {
  method: 'POST',
  body: JSON.stringify({
    action: 'create',
    sheet: 'All',
    "Client Name": 'chriscodle'
  })
}).then(async res => {
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
}).catch(console.error);

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'service-account.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const sheet1Id = '1A_MuvrT5sCKBgyb83Yx1dDhIda1iy4cVtJjKxuIjze0';
  const sheet2Id = '1ADYVV-DEadHNKzphBIRQ8KfqMV9bsH13d54mwQnovS0';

  try {
    // Get info about sheet 1 to find the exact sheet name/range
    const sheet1Info = await sheets.spreadsheets.get({ spreadsheetId: sheet1Id });
    const sheet1Title = sheet1Info.data.sheets[0].properties.title;
    console.log("Sheet 1 Title:", sheet1Title);

    const data1 = await sheets.spreadsheets.values.get({
      spreadsheetId: sheet1Id,
      range: sheet1Title, // fetch all
    });
    fs.writeFileSync('sheet1.json', JSON.stringify(data1.data.values, null, 2));
    
    // Get info about sheet 2
    const sheet2Info = await sheets.spreadsheets.get({ spreadsheetId: sheet2Id });
    const sheet2Title = sheet2Info.data.sheets[0].properties.title;
    console.log("Sheet 2 Title:", sheet2Title);

    const data2 = await sheets.spreadsheets.values.get({
      spreadsheetId: sheet2Id,
      range: sheet2Title, // fetch all
    });
    fs.writeFileSync('sheet2.json', JSON.stringify(data2.data.values, null, 2));

    console.log('Successfully fetched both sheets!');
  } catch (error) {
    console.error('Error fetching sheets:', error.message);
  }
}

main();

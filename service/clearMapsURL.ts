import * as ExcelJS from 'exceljs';
import * as fs from 'fs';

const excelFilePath = 'data.xlsx';

async function clearMapsURL() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelFilePath);

    const worksheet = workbook.getWorksheet(1); // Assuming you're working with the first worksheet.

    if (!worksheet) throw new Error('Worksheet not found.');
    
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        const cellValue = row.getCell('C').value;
        if (typeof cellValue === 'string' && cellValue.startsWith('https://maps.goldenpages.ie')) {
            row.getCell('C').value = null;
        }
    });

    await workbook.xlsx.writeFile(excelFilePath);
}

clearMapsURL().then(() => {
    console.log('Hyperlinks cleared successfully.');
}).catch((error) => {
    console.error('Error:', error);
});

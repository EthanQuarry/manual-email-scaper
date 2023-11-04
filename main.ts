
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
const axios = require('axios');
const cheerio = require('cheerio');


const excelFilePath = 'data.xlsx';



const main = async () => {

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelFilePath);
    
    const worksheet = workbook.getWorksheet("Recovered_Sheet1");
    
    const urls: string[] = [];
    
    if (!worksheet) throw new Error("No worksheet found");
    
    const GetUrls = () => {
        worksheet.eachRow((row, rowNumber) => {
            const cell = row.getCell('C')
            const cellValue = cell.value;
            console.log("Cell Value", cellValue);
            if (typeof cellValue === 'string') {
                urls.push(cellValue);
            }
        });
    }
    GetUrls()
    console.log("URLs", urls);

    const emailRegex = /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))|(mailto:([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;
    
    
    const sanitiseEmails = (Emails: string[]) => {
        for (let i = 0; i < Emails.length; i++) {
            for (let x = 0; x < Emails.length; x++) {
                if (Emails[i] === Emails[x] && i != x) {
                    Emails.splice(x, 1)
                }
            }
        }
        return Emails
    }
    
    const finalFunc = async () => {

        const Emails: string[] = [];
        await Promise.all(urls.map(async url => {
            console.log("Scraping", url);
            try {
                await axios.get(url)
                .then((response: any) => {
                    console.log("Status Code + Url", response.status, url);
                    if (response.status == 200) {
                        const html = response.data;
                        const $ = cheerio.load(html);
                        const bodyText = $('body').text();
                        const emails = bodyText.match(emailRegex);
                        const mailtoLinks = $('a[href^="mailto:"]').map((i: any, link: any) => $(link).attr('href')).get();
                        if (emails) {
                            Emails.push(mailtoLinks[0].replace('mailto:', ''));
                            Emails.push(emails[0])
                        } else console.log("No emails found on", url);
                    }
                })
            } catch (err) {
                console.log("Axios fetch failed:", err);
            }
        }));
    
        const finalList = sanitiseEmails(Emails);
        console.log("Sanitising Emails", finalList);
        fs.writeFile('emails.txt', finalList.join('\n'), (err: any) => {
            if (err) throw err;
            console.log('Emails have been written to emails.txt');
        });
    }
    
    finalFunc();
}

main()
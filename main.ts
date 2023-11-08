
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');


const excelFilePath = 'data.xlsx';



const main = async () => {

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelFilePath);
    
    const worksheet = workbook.getWorksheet("Recovered_Sheet1");
    
    const urls: string[] = [];
    
    if (!worksheet) throw new Error("No worksheet found");
    
    const GetUrls = () => {
        worksheet.eachRow((row, rowNumber) => {
            const cellLink = row.getCell('A')
            const cellSite = row.getCell('B')
            
            const cellSiteValue = cellSite.value;
            const cellLinkValue = cellLink.value;

            console.log("Cell Value", cellSiteValue);

            if (typeof cellSiteValue === 'string' && typeof cellLinkValue === 'string') {
                urls.push(cellSiteValue);
                urls.push(cellLinkValue);
            } 
        });
    }
    GetUrls()
    console.log("URLs", urls);

    const emailRegex = /(?:[a-z0-9+!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/gi
    const regex = /mailto:([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/g;

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
        const browser = await puppeteer.launch();
     
        await Promise.all(urls.map(async url => {
            console.log("Scraping", url);
            const page = await browser.newPage();
     
            try {
                await page.goto(url);
                const bodyText = await page.evaluate(() => document.body.innerText);
                const emails = bodyText.match(emailRegex);
                const mailtoEmails = bodyText.match(regex);
     
                if (emails) {
                    Emails.push(emails[0]);
                } else if (mailtoEmails) {
                    Emails.push(mailtoEmails[0]);
                } else {
                    await page.goto(`${url}/contact`);
                    const bodyText = await page.evaluate(() => document.body.innerText);
                    const emails = bodyText.match(emailRegex);
                    const mailtoEmails = bodyText.match(regex);
                    if (emails) {
                        Emails.push(emails[0]);
                    } else if (mailtoEmails) {
                        Emails.push(mailtoEmails[0]);
                    }
                }
            } catch (err) {
                console.log("Puppeteer fetch failed at ", url);
            } finally {
                await page.close();
            }
        }));
     
        await browser.close();
     
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
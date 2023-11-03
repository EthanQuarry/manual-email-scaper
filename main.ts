
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const csv = require('csv-parser');
const readline = require('readline');


const scrapeEmail = async () => {
    const urls: string[] = [];
    const readInterface = readline.createInterface({
        input: fs.createReadStream('file.csv'),
        output: process.stdout,
        console: false
    });

    return new Promise<string[]>((resolve, reject) => {
        readInterface.on('line', function (line: any) {
            urls.push(line.trim().replace(/"/g, ''));
        });

        readInterface.on('close', function () {
            console.log('CSV file successfully processed');
            resolve(urls);
        });

        readInterface.on('error', function (err: any) {
            reject(err);
        });
    });
}

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
    const urls: string[] = await scrapeEmail();
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
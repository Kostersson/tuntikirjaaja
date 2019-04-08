import * as puppeteer from 'puppeteer'
import * as moment from 'moment'
import {Page} from "puppeteer";

const userId = '';
const username = '';
const password = '';

const projectNumbers = {
    osaaminen: '',
    sovellusmaksut: ''
};


export function run(weekNumber: number, graduWeek: boolean): void {
    const week = moment(weekNumber, "W");
    const startDate = week.format('D.M.YYYY').toString();

    puppeteer
        .launch({args: ['--no-sandbox']})
        .then(browser => {
            browser.newPage()
                .then(page => {
                    return page.goto('https://op.improlity.com/prod/', {waitUntil: 'load'})
                        .then(() => {
                            return page.type('input[name=username]', username)
                                .then(() => page.type('input[name=password]', password))
                                .then(() => page.click('#tryLogin'))
                        })
                        .then(() => page.waitForNavigation())
                        .then(() => page.goto('https://op.improlity.com/prod/C/OP/Project/Hour_edit.aspx?UserID=' + userId + '&StartDate=' + startDate, {waitUntil: ['load', 'networkidle2']}))
                        .then(() => fill(page, weekNumber, graduWeek))
                        .then(() => page.screenshot({path: 'calendar.png'}))
                        .then(() => page.click('#headerbtn_save'))
                        .then(() => Promise.resolve(console.log("Save button...")))
                        .then(() => page.waitForSelector('#m_HeaderTemplate_ctl00_t_MenuHome'))
                })
                .then(result => {
                    return browser.close().then(() => result);
                }, error => {
                    console.log(error);
                    return browser.close().then(() => error);
                });
        });
}

function fill(page: Page, weekNumber: number, graduWeek: boolean): Promise<void> {
    return [0, 1, 2, 3, 4].reduce((acc, weekday) => {
        return acc.then(() => {
            const date = moment(weekNumber, "W").add(weekday, 'd').format('YYYY-MM-DD');
            const selector = 'input[name=' + getProjectNumber(weekday, graduWeek) + '_' + date + ']';
            return page.type(selector, '7.50')
        })
    }, Promise.resolve());
}

function getProjectNumber(weekday: number, graduWeek: boolean): string {
    if (graduWeek && (weekday == 1 || weekday == 3)) {
        return projectNumbers.osaaminen
    } else {
        return projectNumbers.sovellusmaksut
    }
}

const weekNumber = Number(process.argv[2]);
if (isNaN(weekNumber)) {
    console.log("FAILURE! Week number was not a number!")
} else {
    const graduWeek = (process.argv.length > 3 && process.argv[3].includes("gradu"));
    run(weekNumber, graduWeek)
}

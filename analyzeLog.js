#!/usr/bin/env bun
import {parseArgs} from 'util';

const { positionals } = parseArgs({
    args: Bun.argv,
    strict: false,
    allowPositionals: true,
});
const file = Bun.file(positionals[2]);

const statsByIP = {};
const statsByError = {};

if (!(await file.exists())) {
    console.log(`File with name ${file} does not exist`)
    process.exit()
};

const fileValue = await file.text()

fileValue.split('\n').forEach(line => {
    let j = undefined;
    
    try {
        j = JSON.parse(line)
    } catch (e) {
        return;
    }

    let { success, target, error } = j
    if (!target) return;
    if (!statsByIP.hasOwnProperty(target)) {
        statsByIP[target] = {successTrueCount: 0, successFalseCount: 0};
    }
    
    if (success) statsByIP[target].successTrueCount++;

    if (success) return;
    if (!error) return;

    let errorJson = undefined;

    try {
        errorJson = JSON.parse(error);
    } catch(e) {
        return;
    }

    if(errorJson.hasOwnProperty("success")) return;

    if(errorJson.hasOwnProperty("code")) {
        delete errorJson.path;
        error = JSON.stringify(errorJson);
    }

    if (!statsByError.hasOwnProperty(error)) {
        statsByError[error] = {}
    }
    if (!statsByError[error].hasOwnProperty(target)) {
        statsByError[error][target] = 1;
    }
    statsByError[error][target]++
    statsByIP[target].successFalseCount++;
});

let errorCount = 1;

Object.keys(statsByError).sort().forEach(err => {
    const ipsForErr = Object.keys(statsByError[err]);

    console.log(`ERROR#${errorCount++}: ${err} (${ipsForErr.length} IPs)`);
    
    let count = 1;

    ipsForErr.sort().forEach(ip => {
        console.log(`${count++}. ${ip} successTrue: ${statsByIP[ip].successTrueCount} successFalse: ${statsByIP[ip].successFalseCount}`);
    });
});

const successOnlyCount = Object.keys(statsByIP).filter(ip => statsByIP[ip].successTrueCount>0 && statsByIP[ip].successFalseCount===0).length;
const successFalseOnlyCount = Object.keys(statsByIP).filter(ip => statsByIP[ip].successTrueCount===0 && statsByIP[ip].successFalseCount>0).length;
const successSometimesCount = Object.keys(statsByIP).filter(ip => statsByIP[ip].successTrueCount>0 && statsByIP[ip].successFalseCount>0).length;
const totalCount = Object.keys(statsByIP).length;

console.log(`\nNumber of IPs with no errors (successes only): ${successOnlyCount} (of ${totalCount}) (${Math.round(successOnlyCount/totalCount*100)}%)`);
console.log(`Number of IPs only with errors: ${successFalseOnlyCount} (of ${totalCount}) (${Math.round(successFalseOnlyCount/totalCount*100)}%)`);
console.log(`Number of IPs with errors and no errors: ${successSometimesCount} (of ${totalCount}) (${Math.round(successSometimesCount/totalCount*100)}%)`);


// 
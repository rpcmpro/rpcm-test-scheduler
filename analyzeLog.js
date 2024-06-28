#!/usr/bin/env bun
import { parseArgs } from "util";

const { positionals } = parseArgs({
  args: Bun.argv,
  strict: false,
  allowPositionals: true,
});
const file = Bun.file(positionals[2]);

const statsByIP = {};
const statsByError = {};
const ipsOfSerialName = {};
const serialNamesOfIp = {};
const countOfLinesInLogByIp = {};

if (!(await file.exists())) {
  console.log(`File with name ${file} does not exist`);
  process.exit();
}

const fileValue = await file.text();

fileValue.split("\n").forEach((line) => {
  let j = undefined;

  try {
    j = JSON.parse(line);
  } catch (e) {
    return;
  }

  let { success, target, serialName, error } = j;
  if (!target) return;
  if (!statsByIP.hasOwnProperty(target)) {
    statsByIP[target] = { successTrueCount: 0, successFalseCount: 0 };
  }
  if (!serialNamesOfIp.hasOwnProperty(target)) {
    serialNamesOfIp[target] = [];
  }
  if (countOfLinesInLogByIp.hasOwnProperty(target)) {
    countOfLinesInLogByIp[target] += 1;
  } else {
    countOfLinesInLogByIp[target] = 1;
  }

  if (serialName) {
    if (ipsOfSerialName.hasOwnProperty(serialName)) {
      if (!ipsOfSerialName[serialName].includes(target)) {
        ipsOfSerialName[serialName].push(target);
      }
    } else {
      ipsOfSerialName[serialName] = [target];
    }

    if (!serialNamesOfIp[target].includes(serialName)) {
      serialNamesOfIp[target].push(serialName);
    }
  }

  if (success) statsByIP[target].successTrueCount++;

  if (success) return;
  if (!error) return;

  let errorJson = undefined;

  try {
    errorJson = JSON.parse(error);
  } catch (e) {
    return;
  }

  if (errorJson.hasOwnProperty("success")) return;

  if (errorJson.hasOwnProperty("code")) {
    delete errorJson.path;
    error = JSON.stringify(errorJson);
  }

  if (!statsByError.hasOwnProperty(error)) {
    statsByError[error] = {};
  }
  if (!statsByError[error].hasOwnProperty(target)) {
    statsByError[error][target] = 1;
  }
  statsByError[error][target]++;
  statsByIP[target].successFalseCount++;
});

let errorCount = 1;

Object.keys(statsByError)
  .sort()
  .forEach((err) => {
    const ipsForErr = Object.keys(statsByError[err]);

    console.log(`ERROR#${errorCount++}: ${err} (${ipsForErr.length} IPs)`);

    let count = 1;

    ipsForErr.sort().forEach((ip) => {
      console.log(
        `${count++}. ${ip} successTrue: ${statsByIP[ip].successTrueCount} successFalse: ${statsByIP[ip].successFalseCount}`,
      );
    });
  });

const successOnlyCount = Object.keys(statsByIP).filter(
  (ip) =>
    statsByIP[ip].successTrueCount > 0 && statsByIP[ip].successFalseCount === 0,
).length;
const successFalseOnlyCount = Object.keys(statsByIP).filter(
  (ip) =>
    statsByIP[ip].successTrueCount === 0 && statsByIP[ip].successFalseCount > 0,
).length;
const successSometimesCount = Object.keys(statsByIP).filter(
  (ip) =>
    statsByIP[ip].successTrueCount > 0 && statsByIP[ip].successFalseCount > 0,
).length;
const totalCount = Object.keys(statsByIP).length;

console.log(
  `\nNumber of IPs with no errors (successes only): ${successOnlyCount} (of ${totalCount}) (${Math.round((successOnlyCount / totalCount) * 100)}%)`,
);
console.log(
  `Number of IPs only with errors: ${successFalseOnlyCount} (of ${totalCount}) (${Math.round((successFalseOnlyCount / totalCount) * 100)}%)`,
);
console.log(
  `Number of IPs with errors and no errors: ${successSometimesCount} (of ${totalCount}) (${Math.round((successSometimesCount / totalCount) * 100)}%)`,
);

console.log(`Total number of IPs: ${Object.keys(serialNamesOfIp).length}`);
Object.keys(serialNamesOfIp)
  .sort()
  .forEach((ip, index) => {
    console.log(
      `${index + 1}: ${ip}: ${JSON.stringify(serialNamesOfIp[ip])}` +
        ` linesInLog: ${countOfLinesInLogByIp[ip]}` +
        ` ok: ${statsByIP[ip].successTrueCount}` +
        ` fail: ${statsByIP[ip].successFalseCount}`,
    );
  });

console.log(
  `Number of IPs with detected SerialNames ${Object.keys(ipsOfSerialName).length} `,
);

Object.keys(ipsOfSerialName)
  .sort()
  .forEach((sn, index) => {
    console.log(
      `${index + 1}: ${sn}: ${JSON.stringify(ipsOfSerialName[sn])}` +
        ` [${ipsOfSerialName[sn].map(
          (ip) =>
            `"linesInLog: ${countOfLinesInLogByIp[ip]}` +
            ` ok: ${statsByIP[ip].successTrueCount}` +
            ` fail: ${statsByIP[ip].successFalseCount}"`,
        )}]`,
    );
  });
//

// errorCodes
// 0: success all ok (this was a successful try :))
// 1: request timeout
// 2: fetch error
// 3: result of last command not OK for outlet ON
// 4: adminState is not equal to actualState for outlet ON request
// 5: outletState OFF expected to be ON
// 6: adminState is not equal to actualState for outlet OFF request
// 7: outletState ON expected to be OFF
// 8: resultOfLastCommand not OK for outlet OFF request
// 9: resultOfLastCommand not OK for recognition ON request
// 10: recognitionState OFF, expected to be ON
// 11: resultOfLastCommand not OK for recognition OFF request
// 12: recogitionState ON, expected to be OFF
// 13: retry scheduled
// 14: all tries failed, giving up test
// 15: waiting for interhost scheduling interval
// 16: waiting for intercheck interval

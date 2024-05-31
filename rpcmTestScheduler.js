#!/usr/bin/env bun
// Copyright 2024 RCNTEC RPCM (Dennis Neshtoon & Nikolai Babukhin)

// MIT License

// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:

// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import { parse } from 'jsonc-parser';
import { TestProcess } from './lib/TestProcess';
import { Logger } from './lib/logger';
import { daemonize } from './lib/daemonize';
import { parseArgs } from "util";

const { values } = parseArgs({
    args: Bun.argv,
    options: {
      config: {
        type: 'string',
      },
      version: {
        type: 'boolean',
      },
      d: {
        type: 'boolean',
      }
    },
    strict: true,
    allowPositionals: true,
});

if (values.version && !values.config) {
    console.log('0.1.1')
    process.exit()
}


let configFileLocation = values.config || './config.jsonc';
const configFile = Bun.file(configFileLocation);
const configText = await configFile.text();
const configJSON = parse(configText);

const loggerBeginStatus = await Logger.begin({loggerConfig: configJSON.logging});

if (!loggerBeginStatus.success) {
    console.log(JSON.stringify(loggerBeginStatus));
    process.exit();
}

daemonize();

while(true) {
    for(let targetNumber = 0; targetNumber < configJSON.targets.length; targetNumber++) {
        const target = configJSON.targets[targetNumber];
        const { rpcmIpOrFqdn, rpcmApiKey, testType } = target;
        const { retryCountOnNotSuccess, interRetryMilliseconds, rpcmApiRequestTimeoutMilliseconds } = configJSON;

        TestProcess.testRPCM({ 
            ipOrFqdn: rpcmIpOrFqdn, 
            apiKey: rpcmApiKey,
            testType,
            retryCountOnNotSuccess,
            interRetryMilliseconds,
            rpcmApiRequestTimeoutMilliseconds
        });

        Logger.log({
            success: true,
            message: `Waiting interHostSchedulingIntervalMilliseconds ${configJSON.interHostSchedulingIntervalMilliseconds} after rpcmIpOrFqdn ${rpcmIpOrFqdn}`,
            severity: 'info',
        });
        await Bun.sleep(configJSON.interHostSchedulingIntervalMilliseconds);
    }

    Logger.log({
        success: true,
        message: `Waiting interCheckIntervalMinutes ${configJSON.interCheckIntervalMinutes}`,
        severity: 'info',
    });
    await Bun.sleep(configJSON.interCheckIntervalMinutes * 60 * 1000);
}

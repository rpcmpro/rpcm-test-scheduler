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

import { appendFile } from "node:fs/promises";

export class Logger {
    static loggerConfig;

    static async begin({loggerConfig}) {
        Logger.loggerConfig = loggerConfig;

        try {
            loggerConfig?.loggingTargets?.filter(logTarget=>logTarget.loggingTargetType === 'file')
                .forEach(async (logTarget) => {
                    const {loggingTargetFilename} = logTarget
                    const dataToAppend = {
                        datetime: (new Date()).toISOString(),
                        success: true,
                        message: `RPCM Test Scheduler ${Bun.main} has started` ,
                    }
                    await appendFile(loggingTargetFilename, `${JSON.stringify(dataToAppend)}\n`);
            });
        } catch (e) {
            const errorData = {
                datetime: (new Date()).toISOString(),
                success: false,
                message: `RPCM Test Scheduler ${Bun.main} failed to start with error ${e.message}` ,
            }
            return errorData
        };
        return {success: true}
    }

    static async log(logObject) {
        const dataToAppend = {
            datetime: (new Date()).toISOString(),
            ...logObject,
        }
        Logger.loggerConfig?.loggingTargets?.filter(logTarget=>logTarget.loggingTargetType === 'file')
            .forEach(async (logTarget)=>{
                if (logObject.success && logTarget.filter==="successFalse") return;
                try {
                    await appendFile(logTarget.loggingTargetFilename, `${JSON.stringify(dataToAppend)}\n`);            
                } catch (e) {
                    console.log(JSON.stringify({
                        datetime: (new Date()).toISOString(),
                        success: false,
                        message: `Failed to write in log file ${logTarget.loggingTargetFilename}. With error ${e.message}` ,
                    }))
                }
            })
    }
}
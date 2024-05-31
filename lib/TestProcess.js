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

import { RPCM } from './rpcm.js'
import { Logger } from './logger.js'

export class TestProcess {
    static async testRPCM({ 
        ipOrFqdn, 
        apiKey,
        testType,
        retryCountOnNotSuccess = 3,
        interRetryMilliseconds = 60000,
        rpcmApiRequestTimeoutMilliseconds = 10000,
        
    }) {
        const timeoutMilliseconds = rpcmApiRequestTimeoutMilliseconds;
        let triesLeft = retryCountOnNotSuccess;
        let success = false;

        const tryOnce = async ({ipOrFqdn, timeoutMilliseconds, testType, apiKey}) => {
            let result;
            if (testType === 'powerOnOff') {
                result = await RPCM.attemptOutlet9On({
                    ipOrFqdn, timeoutMilliseconds, apiKey
                });

                if (!result.success) return result;
                
                await Bun.sleep(1000);

                result = await RPCM.attemptOutlet9Off({
                    ipOrFqdn, timeoutMilliseconds, apiKey
                });

                return result;
            } else if (testType === 'recognitionOnOff') {
                result = await RPCM.attemptOutlet9RecognitionOn({
                    ipOrFqdn, timeoutMilliseconds, apiKey
                });

                if (!result.success) return result;
                
                await Bun.sleep(1000);

                result = await RPCM.attemptOutlet9RecognitionOff({
                    ipOrFqdn, timeoutMilliseconds, apiKey
                });

                return result;
            } else {
                const log = `Wrong test type`;
                return {success: false, error: JSON.stringify(log)};
            }
        }

        let result = null;

        let errorCount = 0;

        while(triesLeft) {
            result = await tryOnce({ipOrFqdn, timeoutMilliseconds, testType, apiKey});

            if(result?.success) {
                errorCount = 0;
                success = true;
                Logger.log({
                    success,
                    triesLeft,
                    target: ipOrFqdn,
                    timeoutMilliseconds,
                    testType,
                    message: `this was a successful try :)`,
                    severity: 'info',
                });
                break;
            }
            errorCount++
            triesLeft -= 1;
            
            Logger.log({
                success,
                triesLeft, 
                target: ipOrFqdn,
                timeoutMilliseconds,
                testType,
                ...result,
                severity: 'info',
            });
            await Bun.sleep(interRetryMilliseconds);
        }

        if(!result.success) success = false;

        if (errorCount===retryCountOnNotSuccess) {
            Logger.log({
                success,
                target: ipOrFqdn,
                timeoutMilliseconds,
                testType,
                message: `${ipOrFqdn} test ${testType} failed ${errorCount} times in a row`,
                severity: 'alert',
            });
        };

        return success;
    }
}
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

import { Logger } from './logger'

export class RPCM {
    static async request ({ipOrFqdn, apiKey, path, method='GET', timeoutMilliseconds=10000}) {
            const uri = `https://${ipOrFqdn}:8443${path}`;
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject({success:false, error: `fetch timeout ${timeoutMilliseconds} ms`}), timeoutMilliseconds);
            });

            let resultJSON = null;
            let error = null;

            try {
                const fetchPromise = fetch(uri, { tls: {rejectUnauthorized: false}, method, headers: {"API-KEY": apiKey}});
                const result = await Promise.race([fetchPromise, timeoutPromise]);
                if (result?.success === false) {
                    Logger.log({
                        success: false,
                        target: ipOrFqdn, 
                        message: `RPCM request timeout more ${timeoutMilliseconds} ms`, 
                        severity: 'warning',
                    })
                }
                resultJSON = await result.json();
            } catch (e) {
                error = e;
            }

            if(error) {
                Logger.log({
                    success: false, 
                    target: ipOrFqdn,
                    message: 'RPCM request failed', 
                    error: JSON.stringify(error), 
                    severity: 'alert',
                }) 
                return {success: false, error: JSON.stringify(error)}
            }

            return resultJSON;
    }

    static async attemptOutlet9On ({ipOrFqdn, apiKey, timeoutMilliseconds}) {
            let serialName = null;
            const outletOnPath = `/api/outlet/9/on`
            const onResult = await RPCM.request({ipOrFqdn, apiKey, path: outletOnPath, method: 'PUT'})
            if (onResult?.rOLC !== 'OK') {
                Logger.log({
                    success: false, 
                    target: ipOrFqdn, 
                    message: `RPCM result of last command (${outletOnPath}) not OK`, 
                    error: JSON.stringify(onResult?.rOLC), 
                    severity: 'alert',
                }) 
                return { success: false, serialName, error: JSON.stringify(onResult) };
            }

            await Bun.sleep(1000)

            const statusPath = `/api/cachedStatusWithFullNames`
            const statusResult = await RPCM.request({ipOrFqdn, apiKey, path: statusPath, timeoutMilliseconds})
            serialName = statusResult?.serialName
            const outletStatus = statusResult?.ats?.channels?.["9"] 
            if (!(outletStatus?.adminState === 'ON' && outletStatus?.actualState === 'ON')) {
                if(outletStatus && (outletStatus.adminState !== outletStatus.actualState)) {
                    Logger.log({
                        success: false, 
                        target:ipOrFqdn, 
                        message: 'AdministrativeState and actualState are different', 
                        serialName,
                        error: JSON.stringify(outletStatus), 
                        severity: 'warning',
                    })
                }
                Logger.log({
                    success: false, 
                    target:ipOrFqdn, 
                    message: `AdminState is ${outletStatus?.adminState}, actualState is ${outletStatus?.actualState}, but require ON`, 
                    error: JSON.stringify(outletStatus), 
                    severity: 'alert',
                })
                return { success: false, serialName, error: JSON.stringify(outletStatus) }; 
            }

            return {success: true, serialName}
    }

    static async attemptOutlet9Off ({ipOrFqdn, apiKey, timeoutMilliseconds}) {
        let serialName = null;
        const outletOnPath = `/api/outlet/9/off`
        const onResult = await RPCM.request({ipOrFqdn, apiKey, path: outletOnPath, method: 'PUT', timeoutMilliseconds})

        if (onResult?.rOLC !== 'OK') {
            ({success: false, target:ipOrFqdn, message: `RPCM result of last command (${outletOnPath}) not OK`, error: JSON.stringify(onResult?.rOLC), severity: 'alert'}) 
            return { success: false, serialName, error: JSON.stringify(onResult) };
        }

        await Bun.sleep(1000)

        const statusPath = `/api/cachedStatusWithFullNames`
        const statusResult = await RPCM.request({ipOrFqdn, apiKey, path: statusPath})
        serialName = statusResult?.serialName
        const outletStatus = statusResult?.ats?.channels?.["9"] 
        if (!(outletStatus?.adminState === 'OFF' && outletStatus?.actualState === 'OFF')) {
            if(outletStatus && (outletStatus.adminState !== outletStatus.actualState)) {
                Logger.log({
                    success: false, 
                    target:ipOrFqdn, 
                    message: 'AdministrativeState and actualState are different', 
                    serialName,
                    error: JSON.stringify(outletStatus), 
                    severity: 'warning',
                })
            }
            Logger.log({
                success: false, 
                target:ipOrFqdn, 
                message: `AdminState is ${outletStatus?.adminState}, actualState is ${outletStatus?.actualState}, but require OFF`, 
                error: JSON.stringify(outletStatus), 
                severity: 'alert',
            })
            return { success: false, serialName, error: JSON.stringify(outletStatus) }; 
        }

        return {success: true, serialName}
    }

    static async attemptOutlet9RecognitionOn ({ipOrFqdn, apiKey, timeoutMilliseconds}) {
        let serialName = null;
        const outletOnPath = `/api/outlet/9/recognition/on`
        const onResult = await RPCM.request({ipOrFqdn, apiKey, path: outletOnPath, method: 'PUT', timeoutMilliseconds})

        if (onResult?.rOLC !== 'OK') {
            onResult && Logger.log({
                success: false, 
                target:ipOrFqdn, 
                message: `RPCM result of last command (${outletOnPath}) not OK`, 
                error: JSON.stringify(onResult?.rOLC), 
                severity: 'alert',
            }) 
            return { success: false, serialName, error: JSON.stringify(onResult) };
        }

        await Bun.sleep(1000);

        const statusPath = `/api/cachedStatusWithFullNames`
        const statusResult = await RPCM.request({ipOrFqdn, apiKey, path: statusPath})
        serialName = statusResult?.serialName
        const outletStatus = statusResult?.ats?.channels?.["9"] 
        if (!(outletStatus?.recognitionState === 'ON')) {
            outletStatus && Logger.log({
                success: false, 
                target: ipOrFqdn,
                message: `RPCM recognition state is OFF, but require ON`, 
                serialName,
                error: JSON.stringify(outletStatus), 
                severity: 'warning',
            })
            return { success: false, serialName, error: JSON.stringify(outletStatus) }; 
        }

        return {success: true, serialName}
    }

    static async attemptOutlet9RecognitionOff ({ipOrFqdn, apiKey, timeoutMilliseconds}) {
        let serialName = null;
        const outletOnPath = `/api/outlet/9/recognition/off`
        const onResult = await RPCM.request({ipOrFqdn, apiKey, path: outletOnPath, method: 'PUT', timeoutMilliseconds})

        if (onResult?.rOLC !== 'OK') {
            onResult && Logger.log({
                success: false, 
                target: ipOrFqdn, 
                message: `RPCM result of last command (${outletOnPath}) not OK`, 
                error: JSON.stringify(onResult?.rOLC), 
                severity: 'alert',
            }) 
            return { success: false, serialName, error: JSON.stringify(onResult) };
        }

        await Bun.sleep(1000)

        const statusPath = `/api/cachedStatusWithFullNames`
        const statusResult = await RPCM.request({ipOrFqdn, apiKey, path: statusPath})
        serialName = statusResult?.serialName
        const outletStatus = statusResult?.ats?.channels?.["9"] 
        if (!(outletStatus?.recognitionState === 'OFF')) {
            outletStatus && Logger.log({
                success: false, 
                target: ipOrFqdn,
                message: `RPCM recognition state is ON, but require OFF`, 
                serialName,
                error: JSON.stringify(outletStatus), 
                severity: 'warning',
            })
            return { success: false, serialName, error: JSON.stringify(outletStatus) }; 
        }

        return {success: true, serialName}
    }
}
Hello there!

# RCNTEC RPCM presents
`RPCM Test Scheduler` is designed for long-term automated testing of RPCM.
With its help, you can schedule a series of actions that will interact with RPCM using REST API 
and log results.

## Installation
1. Fork this repo

```git clone https://github.com/rpcmpro/rpcm-test-scheduler.git```

2. Install Bun on [official site](https://bun.sh/)
Linux/MacOs example:
```bash
curl -fsSL https://bun.sh/install | bash
```
4. Install dependencies
```bash
bun install
```
5. If you need, change configuration (more in `How to use`)
   
6. Run `RPCM Test Scheduler`
Linux/MacOs example:
```bash
bun ./rpcmTestScheduler.js
```
This script is demonized, and if you need to stop this, use
```bash
ps -ax | grep rpcm
sudo kill *process number*
```

## How to use
!!Please dont change `package.json` and `node_modules` files if you don't know what they are for!!
Main config file is `./config.jsonc`

Config example:
```JSON
{
    "interHostSchedulingIntervalMilliseconds": 1000, //NUMBER in milliseconds. Interval between requests for one host
    "interCheckIntervalMinutes": 1, // NUMBER in minutes. Interval how often to check group of hosts
    "retryCountOnNotSuccess": 3, // NUMBER. how many attempts to make if the check fails
    "interRetryMilliseconds": 60000, // NUMBER. Interval between retry if the check fails
    "rpcmApiRequestTimeoutMilliseconds": 10000, // NUMBER. Timeout for REST API requests
    "logging": { //How to log results
        "loggingTargets": [{ // ARRAY. Logging targets (see types below)
            "loggingTargetType": "file", // "file". Only loggig to files supported so far
            "loggingTargetFilename": "./logSuccessFalse.txt", // STRING (path). Log file location name and path
            "filter": "successFalse" // "everything" OR "successFalse" - for only unsuccessful (bad) logs. "everything" - for all logs
        },{
            "loggingTargetType": "file",
            "loggingTargetFilename": "./logEverything.txt",
            "filter": "everything"
        }
        ] //We recommend to use 2 files. First for successFalse logs, and second for all logs
    },
    "targets": [{ //ARRAY. Targets for testing
        "rpcmIpOrFqdn": "10.210.1.249", //STRING. Supports ip address or FQDN (interdevochka-rpcm.local)
        "rpcmApiKey": null, //NULL OR STRING. Api-key, if RPCM uses it. Check the module settings (Configuration -> API Service Settings -> "API Authentication" switch)
        "testType": "recognitionOnOff"// "recognitionOnOff" OR "powerOnOff"
    },
    {
        "rpcmIpOrFqdn": "10.210.1.254",
        "rpcmApiKey": "cce32379159f006091a8a57a55c3fe3",
        "testType": "powerOnOff"
    }
    ]
}
```


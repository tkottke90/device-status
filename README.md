# Device Monitor

Project which can be installed on a device as as service and provide Operating System information from the `Process` and `OS` modules in NodeJS.

## Project Goals

The goal of this project was to provide a simple light weight way to monitor a server.  To avoid the initial requirement of security, this API does not include an authentication layer and should be served over localhost (127.0.0.1).

## Installation

To use this application, clone the repository and install the dependencies:

```
# Clone repo:
$ git clone git@github.com:tkottke90/device-status.git

# Install dependencies
$ npm i --production
```

After cloning run the `deploy.sh` command to copy the service template to your system.  Please note this needs to be done as root.

The script will ask for the following:

1. Host to attach the service to (optional)
2. The port to attach the service to (optional)
3. The location in your filesystem where the repository is located

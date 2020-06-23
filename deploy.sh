#! /bin/bash

if [[ $(id -u) -ne 0 ]]; then
  echo "Script must be run as root user!"
  exit 1
fi

# ==================
#   Script Functions
# ==================

outputBox() {
	local size=${#1}
	local width=$(( $size + 2 ))	
 
	local widthStr=$(printf "%0.s─" $(seq 1 $width))

	echo
	echo "┌$widthStr┐"
	echo "│ $1 │"
	echo "└$widthStr┘"
}

# Update configuration in a plain text file.  See /etc/ssh/ssh_config
updateConfiguration() {
  config=$1
  value=$2
  file=$3
  
  if grep -q "$config" $file; then
    sed -i -e "s|\b$config\b=.*|$config=$value|g" $file
 
  else 
    echo "Configuration Not Found"
    return
  fi

  echo ">    Updated $config to $value in $file"
}

undoScript() {
  echo ">   Stopping Service..."
  systemctl stop device-status

  echo ">   Disabing Service..."
  systemctl disable device-status

  echo ">   Removing service dir: /etc/device-status"
  rm -rf /etc/device-status

  echo ">   Removing service files: /lib/systemd/system/device-status.service"
  rm -rf /lib/systemd/system/device-status.service
  
  echo ">   Removing user: dstatus"
  userdel dstatus

  echo ">   Reloading systemd"
  systemd daemon-reload
}

abort() {
  undoScript
  exit 1
}

# ==================
#   Main
# ==================

clear
outputBox "Device Status Service Installation"
echo

# Get host to attach service to
read -p "> Host to attach service to (127.0.0.1): " -r app_host
app_host=${app_host:-127.0.0.1}

# Get host port to attach service to
read -p "> Port to attach service to (11000): " -r app_port
app_port=${app_port:-11000}

# Get project location
read -p "> Location of application ($PWD): " -r app_local
app_local=${app_local:-$PWD}

if [ -f "$app_local/index.js" ]; then
  echo "Application Found"
else
  echo "Application does not exists at: $app_local/index.js"
  exit 1
fi;

# Create service directory
echo ">  Creating service directory: /etc/device-status"
mkdir /etc/device-status

# Create service user if it does not exists
if ! id dstatus ; then
  # Create service user
  echo "> Creating service user: dstatus"
  echo ">   Creating user"
  useradd -s /usr/sbin/nologin --system -M -d /etc/device-status dstatus
  echo
fi

# Setup service
echo "> Set user ownership for application directory"
chown -R dstatus:dstatus /etc/device-status
echo "> Creating symlink to application"
ln -s "$app_local/index.js" /etc/device-status/device-status.js
echo "> Copy service file to system"
cp "$app_local/device-status.service.template" /lib/systemd/system/device-status.service

# Update service with configurations
updateConfiguration "HOST" "$app_host" /lib/systemd/system/device-status.service
updateConfiguration "PORT" "$app_port" /lib/systemd/system/device-status.service


# Restart systemctl
echo "> Reload systemctl daemon"
systemctl daemon-reload

# Start service
echo "> Start device-status service"
systemctl start device-status

# Wait 10 seconds
timer=10
echo "> Waiting $timer seconds for service boot"
echo
while [ $timer -gt 0 ]; do
  sleep 1;
  printf "$timer..."
  let "timer--"
done
echo "done"

printf "> Checking service is running..."
if ! systemctl is-active --quiet device-status; then
  echo "Service not running"
  systemctl status device-status

  abort
else 
  echo "Service is running"
fi
echo

# Curl service
printf "> SKIP - Checking service at: $app_host:$app_port/info..."
# curl "http://$app_host:$app_port/info"
# curl_result=$?
# if [ $curl_result -ne 0 ]; then
#   echo "Error ($curl_result)!"
#   echo "> !! Error starting device-status.service !!"
#   echo "> Removing configurations:"
#   echo ">  Check logs by running: sudo systemctl status device-status"
#   echo

#   systemctl status device-status

#   abort $curl_result

#   exit 1;
# else
#   echo "Success!"
#   echo "> Service running successfully!"
# fi;

# Enable on reboot
echo "> Service enabled on reboot"
systemctl enable device-status

echo "> Setup completed successfully!"
echo
echo "    Service available at: $app_host:$app_port"

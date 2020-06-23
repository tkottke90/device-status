#! /bin/bash

# Check if root
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

# ==================
#       Main
# ==================

clear
outputBox "Device Status Service Removal"
echo

undoScript
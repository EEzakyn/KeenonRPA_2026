#!/bin/bash

# รอจนกว่า end0 จะขึ้น (timeout 30 วินาที)
for i in {1..30}; do
    if ip link show end0 | grep -q "state UP"; then
        /sbin/ip addr add 192.168.1.1/24 dev end0
        exit 0
    fi
    sleep 1
done
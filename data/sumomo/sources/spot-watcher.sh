#!/bin/bash
#
# chkconfig: 35 90 12
# description: Spot instance watcher
#
# Get function from functions library
. /etc/init.d/functions
# Start the service spot-watcher
start() {
        initlog -c "echo -n Starting spot-watcher: "
        /bin/spot-watcher 2> /var/log/spot-watcher_error.log 1> var/log/spot-watcher.log &
        ### Create the lock file ###
        echo $! > /var/run/spot-watcher.pid
        touch /var/lock/subsys/spot-watcher
        success $"spot-watcher startup"
        echo
}
# Restart the service spot-watcher
stop() {
        initlog -c "echo -n Stopping spot-watcher: "
        killproc spot-watcher
        ### Now, delete the lock file ###
        rm -f /var/lock/subsys/spot-watcher
        echo
}
### main logic ###
case "$1" in
  start)
        start
        ;;
  stop)
        stop
        ;;
  status)
        status spot-watcher
        ;;
  restart|reload|condrestart)
        stop
        start
        ;;
  *)
        echo $"Usage: $0 {start|stop|restart|reload|status}"
        exit 1
esac
exit 0
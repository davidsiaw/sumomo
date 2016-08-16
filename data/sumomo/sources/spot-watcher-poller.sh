
#!/bin/bash
while [ 1 ]
do
	string=`curl http://169.254.169.254/latest/meta-data/spot/termination-time`
	if [[ $string == *"Not Found"* ]]
	then
		# no problem
		message="MESSAGE=Heartbeat,INSTANCE=`curl http://169.254.169.254/latest/meta-data/instance-id`"
		#aws sns publish --topic-arn "{{ sns_arn }}" --region {{ region }} --message $message
	else
		message="MESSAGE=Terminate,INSTANCE=`curl http://169.254.169.254/latest/meta-data/instance-id`"
		aws sns publish --topic-arn "{{ sns_arn }}" --region {{ region }} --message $message
		break
	fi
	sleep 2
done

while [ 1 ]
do
	sleep 10
done
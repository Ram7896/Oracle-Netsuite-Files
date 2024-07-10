Usereventscript:(1000)
-->It runs on server side and perform events such as record creation,updation or delete.
entrypoints:
.beforesubmit:event occurs 
.beforeload
.aftersubmit
client:(1000)
-->Runs in browser side and customize froms,lists and fields.
(10)lineinit,fieldchange,pageinit,postsourcing,saverecord,sublistchanged,validatefield,delete,insert,line
suitlet:(10000)
-->serverside used tocreate user interface and web applications.
onrequest
scheduled:10000
-->Runs on server side on specific schedule(every hour or everydy)
execute:This function is automatically called by the system at the scheduled time or interval specified 
during deployment
map/reduce script:(10,000)
-->it handles large amount of data and runs in serverside.
entrypoints:getinputdata,map,reduce,summarize
restlet(5000)
-->its an api and perform any funtions that implement suitescript.
-->its an suitescript that executes called by external application or by script.
post: such as creating a NetSuite record.
put:such as inserting/upserting a NetSuite record. 
get:such as retrieving a NetSuite record.
delete:such as deleting a NetSuite record.
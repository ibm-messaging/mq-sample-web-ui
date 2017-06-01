#mq-sample-web-ui
This repository contains a sample web page which uses JavaScript to interact with the 
administrative REST API added in MQ 9.0.1. Support has been added to drive all the major 
capabilities of the REST API available at the MQ 9.0.3 level.


##Instructions:

In order to use this sample you will need to perform the following steps:

1. Install MQ 9.0.3 on your favourite platform, remembering to include the Web component.

2. Configure the mqweb server so that users can log in to the REST API. Documentation on
how to do this is here: 
https://www.ibm.com/support/knowledgecenter/SSFKSJ_9.0.0/com.ibm.mq.con.doc/q128300_.htm

3. Install the provided index.html and simplemqweb.js files in a suitable web serving 
environment. The approach used for this will vary depending on environment. For example,
if using WebSphere Liberty Profile (WLP) then you can simply run the following command:

jar -cvf mqwebui.war index.html simplemqweb.js

and copy the resulting mqwebui.war to the dropins directory of your server. Note
that the WLP install provided with MQ is not licensed for running user code.

4. Add the origin hosting the mqwebui.war file to the Cross Origin Resource Sharing (CORS)
configuration in the mqweb server. More information on how to do that is here:
https://www.ibm.com/support/knowledgecenter/SSFKSJ_9.0.0/com.ibm.mq.sec.doc/q128790_.htm

5. Access the sample webui using your browser. For example if running the sample in WLP 
the URL would be something like: https://localhost:9444/simple/, but with whatever 
port and hostname had been configured.


## Some trouble shooting hints:

* If you can bring up the sample webui but get a message about a CORS error then review
the CORS configuration in step 4 above.

* You don't have to host the sample application in a web server, you can load it
directly from the file system. However your requests will get rejected by your web browser
due to you CORS configuration. To rectify this either use a web-server or disable security
in the mqweb server. Disabling security can be achieved by using the no_security sample
described here: 

https://www.ibm.com/support/knowledgecenter/SSFKSJ_9.0.0/com.ibm.mq.sec.doc/q127970_.htm


##Problems:

If you have any problems with this sample please create an Issue and let us know.

##License:
Please read the accompanying license.txt file prior to use.
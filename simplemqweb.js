/*
 * Copyright (c) 2017 IBM Corporation.
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 */

/*
 * Simple JavaScript for use by the accompanying index.html.
 */

  //Set on log-in, nulled on log-out.
  var cachedCSRFToken = null;

  function onLoad() {
    setButtonState();
  }

  function showLoginDetails() {
    var url = getURLPrefix() + "login";
    submitCommonGETRequest(url, printLoginDetails, unexpectedErrorHandler);
  }

  function printLoginDetails(json) {
    var arrayLength = json.user.length;

    for (var i = 0; i < arrayLength; i++) {
      appendText("User " + json.user[i].name + " is in these role(s): " + json.user[i].role + ".");
    }
  }

  function unexpectedErrorHandler(msg, statusCode, json) {
    appendText("Unexpected error "+ msg + ", status code: " + statusCode + ".");
    appendBlankLine();
    appendRESTErrorMessage(json);
  }

  function appendText(text) {
    var resultsDiv = document.getElementById("results");
    var resultDiv = document.createElement("div"); 
    resultDiv.innerHTML = escapeHtml(text);
    resultsDiv.appendChild(resultDiv);
  }

  function escapeHtml(text) {
    return text
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
  }

  function appendBlankLine() {
    var resultsDiv = document.getElementById("results");
    var resultDiv = document.createElement("div"); 
    resultDiv.innerHTML = "<br/>";
    resultsDiv.appendChild(resultDiv);
  }

  function appendRESTErrorMessage(json) {
    appendText("Message:     " + json.error[0].message);
    appendText("Explanation: " + json.error[0].explanation);
    appendText("Action:      " + json.error[0].action);
  }

  function getURLPrefix() {
    return getInput("urlRoot") + "ibmmq/rest/v1/";
  }

  function getInput(inputName) {
    return document.getElementById(inputName).value;
  }

  function submitCommonGETRequest(url, successCallback, errorCallback) {
    clearResults();
    outputURL(url);

    //Login passing in function to call if login succeeds.
    login(function() {      
      var request = new XMLHttpRequest();

      //Need this to allow LTPA/Session cookies to be flowed/accessed.
      request.withCredentials = true;
      request.open("GET", url, true);
      
      //Register handler for result.
      request.onload = function () {
        var parsedResponse = JSON.parse(request.response);
        
        if(request.status < 400) {
          successCallback(parsedResponse);
        }
        else {
          errorCallback("on get", request.status, parsedResponse);
        }

        logout();
      };
    
      //Send request.
      request.send();
    });
  }

  function clearResults() {
    var results = document.getElementById("results");
    while(results.firstChild) {
        results.removeChild(results.firstChild);
    }
  }

  function outputURL(url) {
    appendText("Calling URL: " + url);
    appendBlankLine();
  }

  function login(successCallback) {
    if(isSecurityEnabled()) {
      var url = getURLPrefix() + "login";

      var request = new XMLHttpRequest();

      //Need this to allow LTPA/Session cookies to be flowed/accessed.
      request.withCredentials = true;
      request.open("POST", url, true);
      request.setRequestHeader('Content-Type','application/json');

      var userId = getInput("userId");
      var password = getInput("password");

      request.onload = function () {            
        if(request.status == 204) {
          //Stash CSRF token.
          cachedCSRFToken = getCSRFToken();

          //Drive callers callback.
          successCallback(); 
        }
        else {
          unexpectedErrorHandler("on login", request.status, JSON.parse(request.response));
        }
      };

      request.onerror = function() {
        appendText("An unexpected error has occurred. This might be caused by CORS.");
      };

      //Send request.
      request.send(JSON.stringify({"username" : userId, "password" : password}));
    } 
    else {
      //Drive the callback directly.
      successCallback();
    }
  }

  function isSecurityEnabled() {
    return document.getElementById("securityEnabled").checked;
  }

  function getCSRFToken() {
    var token = null;
    var cookieName = "csrfToken=";

    //Get the CSRF token from the cookies returned by logging in to the 
    //REST API.
    var cookies = document.cookie.split(";");

    for(var i=0; i < cookies.length; i++) {
      var cookie = cookies[i].trim();

      if(cookie.startsWith(cookieName)) {
        token = cookie.substring(cookieName.length,cookie.length)
      }
    }

    return token;
  }

  function logout() {
    if(isSecurityEnabled()) {
      var url = getURLPrefix() + "login";
    
      var request = new XMLHttpRequest();

      //Need this to allow LTPA/Session cookies to be flowed/accessed.
      request.withCredentials = true;
      request.open("DELETE", url, true);

      request.setRequestHeader('ibm-mq-rest-csrf-token', cachedCSRFToken);

      request.onload = function () {      
        //Null out CSRF token as we have logged out.
        cachedCSRFToken = null;      
        if(request.status != 204) {
          unexpectedErrorHandler("on logout", request.status, JSON.parse(request.response));
        }
      };

      request.send();
    }
  }

  function showInstallation() {
    var url = getURLPrefix() + "installation";
    submitCommonGETRequest(url, printInstallationResult, unexpectedErrorHandler);
  }

  function printInstallationResult(result) {
    var arrayLength = result.installation.length;

    for(var i = 0; i < arrayLength; i++) {
      appendText("Installation found with name: " + result.installation[i].name + ".");
    }
  }

  function showAllQueueManagers() {
    var url = getURLPrefix() + "qmgr";
    submitCommonGETRequest(url, printAllQueueManagersResult, unexpectedErrorHandler);
  }

  function printAllQueueManagersResult(result) {
    var arrayLength = result.qmgr.length;

    if(arrayLength == 0) {
      appendText("No matching queue manager found.");
    }
    else {
      for (var i = 0; i < arrayLength; i++) {
        appendText("Queue manager " + result.qmgr[i].name + " is " + result.qmgr[i].state + ".");
      }
    }
  }

  function showSpecifiedQueueManager() {
    var url = getURLPrefix() + "qmgr/" + getQueueManagerName();
    submitCommonGETRequest(url, printAllQueueManagersResult, notFoundHandler);
  }

  function notFoundHandler(msg, statusCode, json) {
    if(statusCode == 404) {
      appendText("Resource not found.");
      appendBlankLine();
      appendRESTErrorMessage(json);
    } 
    else {
      unexpectedErrorHandler(msg, statusCode, json);
    }
  }

  function getQueueManagerName() {
    return queueManagerName = getInput("qmgrName");
  }

  function showSpecifiedQueueManagerStatus() {
    var url = getURLPrefix() + "qmgr/" + getQueueManagerName() + "?status=*";
    submitCommonGETRequest(url, printQueueManagerStatusResult, notFoundHandler);
  }

  function printQueueManagerStatusResult(result) {
    var arrayLength = result.qmgr.length;

    for (var i = 0; i < arrayLength; i++) {
      if(result.qmgr[i].status == null) {
        appendText("Queue manager " + result.qmgr[i].name + " is not running.");
      }
      else {
        appendText("Queue manager " + result.qmgr[i].name + " has " + result.qmgr[i].status.connectionCount + " active connections.");
      }
    }
  }

  function submitQueueGETRequest() {
    var url = getURLPrefix() + "qmgr/" + getQueueManagerName() + "/queue/" + getQueueName() + "?attributes=general.description&status=status.currentDepth";
    submitCommonGETRequest(url, printQueueResult, notFoundHandler);
  }

  function printQueueResult(result) {
    var arrayLength = result.queue.length;

    if(arrayLength == 0) {
      appendText("No matching queue found.");
    }
    else
    {
      for(var i = 0; i < arrayLength; i++) {
        appendText("Queue found with name: " + result.queue[i].name + ", of type: " + result.queue[i].type + " and description: " + result.queue[i].general.description+ ".");

        if(result.queue[i].type == "local") {
           appendText("Queue depth: " + result.queue[i].status.currentDepth + ".");
        }
      }
    }
  }

  function getQueueName()
  {
    return getInput("queueName");
  }

  function submitQueuePOSTRequest() {
    var url = getURLPrefix() + "qmgr/" + getQueueManagerName() + "/queue";

    clearResults();

    outputURL(url);

    //Login and pass in a function to call once logged in.
    login(function(){
      var request = new XMLHttpRequest();

      //Need this to allow LTPA/Session cookies to be flowed/accessed.
      request.withCredentials = true;
      request.open("POST", url, true);

      request.setRequestHeader('Content-Type','application/json');
      request.setRequestHeader('ibm-mq-rest-csrf-token', cachedCSRFToken);

      request.onload = function () {            
        if(request.status == 201) {
          appendText("Queue created.");
        }
        else {
          unexpectedErrorHandler("on creating queue", request.status, JSON.parse(request.response));
        }

        logout();
      };

      //Send request.
      request.send(JSON.stringify({"name":getQueueName(), "general": {"description": getQueueDescription()}}));
    });
 }

  function getQueueDescription() {
    return getInput("queueDescription");
  }

 function submitQueueDELETERequest() {
    var url = getURLPrefix() + "qmgr/" + getQueueManagerName() + "/queue/" + getQueueName();

    clearResults();

    outputURL(url);

    //Login and pass function to call on login success.
    login(function(){
      var request = new XMLHttpRequest();

      //Need this to allow LTPA/Session cookies to be flowed/accessed.
      request.withCredentials = true;
      request.open("DELETE", url, true);

      //Need to set CSRF header as this is a DELETE.
      request.setRequestHeader('ibm-mq-rest-csrf-token', cachedCSRFToken);

      //Send request.
      request.send();

      request.onload = function () {            
        if(request.status == 204) {
          appendText("Queue deleted.");
        }
        else {
          unexpectedErrorHandler("on deleting queue", request.status, JSON.parse(request.response));
        }

        logout();
      };
    });
 }

  function submitQueuePATCHRequest() {
    var url = getURLPrefix() + "qmgr/" + getQueueManagerName() + "/queue/" + getQueueName();

    clearResults();

    outputURL(url);

    //Login and pass function to call on login success.
    login(function(){
      var request = new XMLHttpRequest();

      //Need this to allow LTPA/Session cookies to be flowed/accessed.
      request.withCredentials = true;
      request.open("PATCH", url, true);

      request.setRequestHeader('Content-Type','application/json');

      //Need to set CSRF header as this is a PATCH.
      request.setRequestHeader('ibm-mq-rest-csrf-token', cachedCSRFToken);

      //Send request.
      request.send(JSON.stringify({"general": {"description": getQueueDescription()}}));

      request.onload = function () {            
        if(request.status == 204) {
          appendText("Queue altered.");
        }
        else {
          unexpectedErrorHandler("on altering queue", request.status, JSON.parse(request.response));
        }

        logout();
      };
    });
  }

  function securityEnabledClicked() {
    var checked = document.getElementById("securityEnabled").checked;
    setElementEnabled("userId", checked);
    setElementEnabled("password", checked);
  }

  function setElementEnabled(elementName, enabled) {
    document.getElementById(elementName).disabled = !enabled;
  }

  function setButtonState() {
    var urlRootSet = isInputSet("urlRoot") && getInput("urlRoot").match("https?://.+");
    var queueNameSet = isInputSet("queueName");
    var qmgrNameSet = isInputSet("qmgrName");
    var securityCredentialsSet = document.getElementById("securityEnabled").checked == false || (isInputSet("password") && isInputSet("userId"));

    //These buttons only need the url and login details.
    setElementEnabled("showLoginDetailsButton", urlRootSet && securityCredentialsSet);
    setElementEnabled("showInstallationButton", urlRootSet && securityCredentialsSet);
    setElementEnabled("showAllQueueManagersButton", urlRootSet && securityCredentialsSet);

    //These buttons need url, login details and a queue manager name.
    setElementEnabled("showSpecifiedQueueManagerButton", urlRootSet && securityCredentialsSet && qmgrNameSet);
    setElementEnabled("showSpecifiedQueueManagerStatusButton", urlRootSet && securityCredentialsSet && qmgrNameSet);

    //These buttons need url, login details, queue manager name, and queue name.
    setElementEnabled("submitQueueGetButton",urlRootSet &&  securityCredentialsSet && qmgrNameSet && queueNameSet);
    setElementEnabled("submitQueueDeleteButton", urlRootSet && securityCredentialsSet && qmgrNameSet && queueNameSet);
    setElementEnabled("submitQueuePostButton", urlRootSet && securityCredentialsSet && qmgrNameSet && queueNameSet);
    setElementEnabled("submitQueuePatchButton", urlRootSet && securityCredentialsSet && qmgrNameSet && queueNameSet);
  }

  function isInputSet(inputName) {
    return getInput(inputName).length > 0;
  }
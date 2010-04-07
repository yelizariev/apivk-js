// -*- coding: utf-8 -*-

// Copyright (c) 2010 The apivk-js.googlecode.com project Authors.
// All rights reserved. Use of this source code is governed
// by a BSD-style license that can be found in the LICENSE file.

// url in repo: $URL$
// Author   of current version: $Author$
// Date     of current version: $Date$
// Revision of current version: $Rev$

// Based on http://code.google.com/p/vk-jsapi



/**
 * Create new object to call Vkontakte API throurh it.
 *
 * @class
 * @param {String} api_secret Application sercet (can be
 * changed on application edit page).
 * @param {Function} onSuccess Function to perform after API
 * initialised.
 * @param {Function} onFail Function to perform if API
 * initialisation fails for msome reason.
 * @param {Boolean} test_mode If set to true then all
 * requests will be executed in test mode - additional parameter
 * test_mode=1 will be automatically added to every API request, so
 * you needn't do it manually.
 */
function APIVK(api_secret, onSuccess, onFail, test_mode) {
  /****************** Private Constants and variables *******************/
  /**
   * @constant
   * @private
   */
  const vk_js_xd_connection = 'http://vk.com/js/xd_connection.js';
  /**
   * @constant
   * @private
   */
  const vk_js_lib_md5 = 'http://vk.com/js/lib/md5.js';
  /**
   * @constant
   * @private
   */
  const api_version = '2.0';
  /**
   * Queue of callback functions used by addCallback() to perform correct
   * processing of multiple events assigned in different places
   * @private
   */
  var callbacks = {};
  /**
   * Queue of api request used when handle error 6 "too many

   * requests per second"
   * @private
   */
  var apiQueue = [];
  /**
   * timer delay, when got error 6
   * @private
   */
  var timer;
  /**
   * @private
   */
  var timerIntervar = 400;
  /**
   * num of api request used for make unique name callback function
   * in api request
   * @private
   */
  var apiHandlerNum = 0;
  window.apivk__ = {};
  /**
   * Hack to use 'this' reference in callback functions in private methods
   * @private
   */
  var this_proxy = this;
  /***************** /Private Constants and variables *******************/


  /************************* Public Properties **************************/
  /**
   * Parameters, which were sent to application through request string
   * @type Object
   */
  this.params = {};
  /************************ /Public Properties **************************/


  /****************************** Methods *******************************/
  /**** Private: ****/

  /**
   * Sort key-value pairs in objects by alphaber in ascending order.
   *
   * @private
   * @param {Object} obj Object which keys to sort.
   * @returns {Object} Object with the same set key-value pairs as 'obj' but
   *                sorted in ascending order.
   */
  function _sortByKey(obj) {

    //make Array from object keys
    var keys = new Array();
    for (var k in obj) {
      keys.push(k);
    }

    //sort Array
    keys.sort();

    //form new object with keys sorted alphabetically
    var sortedObj = {};
    for (var i = 0; i < keys.length; i++) {
      sortedObj[keys[i]] = obj[keys[i]];
    }

    return sortedObj;
  }
  /**
   * Perform XSS-request (load JavaScript).
   *
   * @private
   * @param String url URL of JavaScript file to load and execute in
   * context of this page.
   */
  function _reqScript(url) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    document.getElementsByTagName('head')[0].appendChild(script);
  }
  /**
   * @private
   */
  function _onError6(args){
    if (timer)
      apiQueue.push(args);
    else{
      timer = setInterval(_onTimer, timerIntervar);
      _call(args);
    }
  }
  /**
   * @private
   */
  function _onTimer(){
    args = apiQueue.shift(); //fifo
    _call(args);
    if (apiQueue.length == 0){
      clearInterval(timer);
      timer = null;
    }
  }
  /**
   * @private
   */
  function _call(args) {
    //if (!args) return;
    var method = args[0];
    var params = args[1] || null;
    var success = args[2] || null;
    var error = args[3] || null;

    var hNum = apiHandlerNum++;
    apivk__['h' + hNum] = function(json) {
      delete apivk__['func'+hNum];
      if (json.response)
        if (success)
          success(json.response);
      if (json.error){
        json = json.error;
        if (json.error_code == 6)
          _onError6(args);
        else if (error)
          error(json.error_code, json.error_msg, json.request_params)
      }
    };


    //parameters to send to server
    var parameters = params || {};

    //append parameters with common strings
    parameters.api_id = this_proxy.params.api_id;
    parameters.v = api_version;
    parameters.format = 'JSON';
    parameters.callback = 'apivk__.h'+hNum;

    //set test mode
    if (test_mode) parameters.test_mode = '1';

    //append parameters with method name
    parameters.method = method;

    //sort parameters
    parameters = _sortByKey(parameters);


    //calculate API signature and add it to parameters list
    var sig = this_proxy.params.viewer_id;
    for (var k in parameters) {

      //can be array
      if (typeof parameters[k] == 'object') {
        sig += k + '=' + parameters[k].join(',');

        //ordinar parameter
      } else {
        sig += k + '=' + parameters[k];
      }
    }
    sig += api_secret;
    parameters.sig = MD5(sig);

    //form URL to call
    var url = this_proxy.params.api_url + '?';
    for (var k in parameters) {
      url += k + '=' + encodeURIComponent(parameters[k]) + '&';
    }


    //load and execute script
    _reqScript(url);
  }

  /**** Public: ****/
  /**
   * Call Vkontakte API method.
   * @param {String} method Method name to execute.
   * @param {Object} params Parameters of API method in the following
   *                          form:
   *                          {
   *                              name1: 'value 1',
   *                              name2: 'value 2',
   *
   *                              //arrays are also allowed
   *                              name3: [
   *                                  'array_value_1',
   *                                  'array_value_2',
   *                                  'array_value_3'
   *                              ]
   *                          }
   * @param {Function} success Callback function to perform when
   * answer from API call comes from server.  success(data), data -
   * content of "response" json node
   * @param {Function} error Callback function to perform when
   * answer from API call comes from server.  error(code, msg,
   * reqParams)
   */
  this.call = function(){
    if (timer)
      apiQueue.push(arguments);
    else
      _call(arguments);
  }
  /***************************** /Methods *******************************/

  /************************ Initialize object ***************************/
  //request MD5 function from vkontakte
  _reqScript(vk_js_lib_md5);

  //first of all we need to load special library from vk.com
  _reqScript(vk_js_xd_connection);

  /**
   * wait to 'APIVK_ibnitializer' to load
   * @private
   */
  var VKLOAD = setInterval(apivkInit, 100);

  /**
   * Perform when 'APIVK_initializer' loaded.
   * @private
   */
  function apivkInit() {
    if ((typeof VK == 'undefined') || (typeof MD5 == 'undefined'))
      return;
    clearInterval(VKLOAD);

    //initialize VK object
    VK.init(function() {
        //Perform on successful

        //get VK.params and translate it to APIVK.params
        VK.loadParams(document.location.href);
        this_proxy.params = VK.params;

        //parse json response from the first api call result if
        //it is not in XML
        if ((typeof this_proxy.params.api_result != 'undefined') &&
            (this_proxy.params.api_result.indexOf('<?xml') != 0)
            ) {
          this_proxy.params.api_result = eval('(' + this_proxy.params.api_result + ')');
        }

        /**
         * map VK.External methods to APIVK.external
         * @memberOf APIVK#
         * @name external
         * @type Object
         */
        this_proxy.external = VK.External;

        /**
         * Add callback function.
         *
         * @methodOf APIVK#
         * @name addCallback
         * @param String name Name of event to which callback
         *                    will be added.
         * @param Function callback Callback function to run
         *                          after event 'name' occurs.
         * @return Number ID of assigned callback function.
         */
        this_proxy.addCallback = function(name, callback) {
          //add callback to the queue
          if (typeof callbacks[name] == 'undefined') {
            callbacks[name] = new Array();
            //add callback using VK
            VK.addCallback(name, function() {
                /**
                 * Function uses callbacks queue to call all
                 * functions that were added using addCallback()
                 * in order it were added.
                 */

                //call every callback in the queue
                for (var c in callbacks[name]) {

                  //form callback call with arguments
                  if (callbacks[name][c])
                    callbacks[name][c].apply(null, arguments);
                }
              });
          }
          callbacks[name].push(callback);
          //return so called ID of assigned callback function
          //to use it in removeCallback() function
          return callbacks[name].length - 1;
        };

        /**
         * Remove callback function from the queue.
         *
         * @methodOf APIVK#
         * @name removeCallback
         * @param String name Name of event from which callback
         *                    will be removed.
         * @param Number callback_id ID of callback function to
         *                           remove from queue.
         */
        this_proxy.removeCallback = function(name, callback_id) {
          //do not remove callback using low-level function
          //VK.removeCallback(name, callback);

          //remove function from the queue
           callbacks[name][callback_id]=null;
        };
        //execute user initialisation function
        if (onSuccess)
          onSuccess();
      },
      function() {
        // Perform on init failure.
        if (onFail)
          onFail();
      });
  }
  /*********************** /Initialize object ***************************/
}

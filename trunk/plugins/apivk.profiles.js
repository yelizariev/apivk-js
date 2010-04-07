// -*- coding: utf-8 -*-

// Copyright (c) 2010 The apivk-js.googlecode.com project Authors.
// All rights reserved. Use of this source code is governed
// by a BSD-style license that can be found in the LICENSE file.

// url in repo: $URL: https://apivk-js.googlecode.com/svn/trunk/src/apivk.js $
// Author   of current version: $Author: ivann.exe $
// Date     of current version: $Date: 2010-03-14 20:03:34 +0500 (Sun, 14 Mar 2010) $
// Revision of current version: $Rev: 3 $

/**
 * @fileOverview Add methods to class APIVK for getting adn caching
 * user profiles data
 */

(function (){
  var maxCachedRecords;
  var cachedRecords = []; // [{"uid":123, "first_name", ...}, ...]
  var getProfilesFields;
  var collected; //[[uids, onReady, noCachedUids], ...]
  var timer;
  var collectingInterval = 1000;
  var apivk;
  /**
   * initialize apivk.profiles.js plugin
   * @param {Number} maxCachedRecords maximum cached user profiles records
   * @param {Number} collectingInterval interval collecting uid from
   * calling {@link #getProfile} for send all in one  request
   * @param {Object} fields necessary profile fields
   */
  APIVK.prototype.getProfilesInit = function(maxCachedRecords0,
                                            collectingInterval0,
                                            fields){
    collectingInterval = collectingInterval0;
    apivk = this;
    maxCachedRecords = maxCachedRecords0;
    getProfilesFields = fields.join(',');
  };
  /**
   * @param uids list user id
   * @param {Function} onReady onReady(data). Array "data" contain
   * object with fields, which were specifing in {@link
   * #getProfileInit}
   */
  APIVK.prototype.getProfiles = function(uids, onReady){
    var s = _split(uids);
    if (s.noCached.length==0)
      onReady(s.cached);
    else if (timer){
      //if collecting
      collected.push([uids, onReady, s.noCached]);
    }else{
      //begin collecting
      timer = setTimeout(_onTimer, collectingInterval);
      collected=[[uids, onReady, s.noCached]];
    }
  };
   /**
    * @return {cached: [uidData], noCached: [uid]}
    */
  function _split(uids){
    var cached=[];
    var cachedUids=[];
    var len = uids.length;
    each(cachedRecords, function(k, v){
           if (indexOf(uids, v.uid) !== -1){
             cachedUids.push(v.uid);
             return (cached.push(v) != len);
           }
         }
        );
    var noCached=[];
    each(uids, function(k, uid){
           if (indexOf(cachedUids, uid) === -1)
             noCached.push(uid);
         }
        );
    return {cached:cached, noCached:noCached};
  }
  function _onTimer(){
    clearTimeout(timer);
    timer = null;
    var uids = [];
    each(collected, function(k, v){
      uids.push(v[2].join(','));
    });
    uids = uids.join(',');
    var collected2 = collected.slice(0);
    apivk.call('getProfiles',
               {fields: getProfilesFields, uids: uids},
                function(data){
                  cachedRecords=cachedRecords.concat(data);
                  each(collected2, function(k,v){
                    v[1](_split(v[0]).cached);
                  });
                    var len=cachedRecords.length;
                  if (len>maxCachedRecords)
                    cachedRecords.splice(0, len-maxCachedRecords);
                }
              );
  }
})()
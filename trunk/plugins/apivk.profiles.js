/**
 * @fileOverview Add methods to class APIVK for getting adn caching
 * user profiles data
 */

(function (){
	var maxCachedRecords;
	var cachedRecords = []; // [[uid, data], ...]
	var getProfilesFields;
	var nextRequestData; //[[uid, onReady], ...]
	var maxUidsPerRequest = 1000; //api limit
	var timer;
	var timerInterval = 1000;
	var apivk;
	/**
	 * initialize apivk.profiles.js plugin
	 * @param {Number} maxCachedRecords maximum cached user profiles records
	 * @param {Number} collectingInterval interval collecting uid from
	 * calling {@link #getProfile} for send all in one  request
	 * @param {Object} fields necessary profile fields
	 */
	APIVK.prototype.getProfileInit = function(maxCachedRecords0,
	                                          collectingInterval,
	                                          fields){
		timerInterval = collectingInterval;
		apivk = this;
		maxCachedRecords = maxCachedRecords0;
		getProfilesFields = '';
		for (var i=0; i<fields.length; i++)
			getProfilesFields += fields[i] + ',';
		getProfilesFields = getProfilesFields.slice(0, -1);
	}
	/**
	 * @param uid user id
	 * @param {Function} onReady onReady(data). Object "data" contain
	 * fields, which were specifing in {@link #getProfileInit}
	 */
	APIVK.prototype.getProfile = function(uid, onReady){
		var r = _uid2value(uid, cachedRecords);
		if (r)
			onReady(r);
		else if (timer){
			if (nextRequestData.push(arguments) == maxUidsPerRequest)
				_onTimer();
		}else{
			timer = setTimeout(_onTimer, timerInterval);
			nextRequestData = [arguments];
		}
	}
	function _onTimer(){
		clearTimeout(timer);
		timer = null;
		var uids = '';
		for (var i=0; i<nextRequestData.length; i++)
			uids += nextRequestData[i][0] + ',';
		uids = uids.slice(0, -1);
		var code = 'return API.getProfiles({"uids":"'+ uids +'", "fields":"'+
			getProfilesFields + '"});';
		var nextRequestDataDuplicate = nextRequestData.slice(0);
		apivk.call('execute', {params: {code: code}, success: function(data){
					var uid;
					for (var i=0; i<data.length; i++){
						uid = data[i].uid;
						var onReady = _uid2value(uid, nextRequestDataDuplicate);
						onReady(data[i]);
						if (cachedRecords.push([uid, data[i]]) >= maxCachedRecords)
							cachedRecords.shift();
					}
				}
			});
	}
	function _uid2value(uid, array){
		for (var i=0; i<array.length; i++)
			if (array[i][0] == uid)
				return array[i][1];
		return null;
	}
})()
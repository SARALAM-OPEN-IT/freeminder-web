'use strict';

/**
 * @ngdoc service
 * @name freeminderApp.profile
 * @description
 * # profile
 * Service in the freeminderApp.
 */
angular.module('freeminderApp')
  .service('Profile', [ 'Parse', '$q', '$log', '$timeout', '$cacheFactory', 'userService',
    function(Parse, $q, $log, $timeout, $cacheFactory, userService){
      //console.log('ProfileService');
      var cache = $cacheFactory('Profile');

      var transformJSON = function(result) {
        var profile = {};
        profile.userId = result.objectId || '';
        var account = (result.datastore) ? (result.datastore.account || {}) : {};
        profile.firstName = account.firstName || '';
        profile.lastName = account.lastName || '';
        profile.address = account.address || '';
        profile.city = account.city || '';
        profile.state = account.state || '';
        profile.zipcode = account.zipcode || '';
        profile.email = result.email || '';
        profile.mobile = result.mobile || '';
        profile.image = result.image || '';
        return profile;
      };

      var _updateCacheObj = function(cacheObj, user, pInfo) {

        // for firsttime users they may not have datastore account
        cacheObj.datastore.account = cacheObj.datastore.account || {};

        cacheObj.datastore.account.firstName = pInfo.firstName;
        cacheObj.datastore.account.lastName = pInfo.lastName;
        cacheObj.datastore.account.address = pInfo.address;
        cacheObj.datastore.account.city = pInfo.city;
        cacheObj.datastore.account.state = pInfo.state;
        cacheObj.datastore.account.zipcode = pInfo.zipcode;
        cacheObj.mobile = pInfo.mobile;
        cacheObj.image = pInfo.image;
        cache.put(user.oID + 'ProfileInfo', cacheObj);

        return cacheObj;
      };

      var _getProfileUpdatePayload = function(cacheObj) {
        // now create payload from cache
        var payload = {};
        payload.datastore = cacheObj.datastore;
        payload.mobile = cacheObj.mobile;
        return payload;
      };

      var _generateJSONForUpdate = function(pInfo) {

        var deferred = $q.defer();

        var user = userService.getUser();
        var cacheObj = cache.get(user.oID + 'ProfileInfo');
        if (!cacheObj || !cacheObj.datastore) {
          //get updated profile
          _getProfileInfo(false, true).then(function(profileInfo) {
            var updatedProfile = _updateCacheObj(profileInfo, user, pInfo);
            var payload = _getProfileUpdatePayload(updatedProfile);
            deferred.resolve(payload);
          }, function() {
            deferred.reject();
          });
        }
        else {
          var updatedProfile = _updateCacheObj(cacheObj, user, pInfo);
          var payload = _getProfileUpdatePayload(updatedProfile);
          deferred.resolve(payload);
        }

        return deferred.promise;
      };

      var _getProfileInfo = function(fromCache, completeProfile) {

        var deferred = $q.defer();
        var user = userService.getUser();
        if(fromCache) {
          var profileInfo = cache.get(user.oID + 'ProfileInfo');
          if (profileInfo) {
            profileInfo = completeProfile ? profileInfo : transformJSON(profileInfo);
            deferred.resolve(profileInfo);
            return deferred.promise;
          }
        }

        // not in cache
        /*
        var promise = Parse.query({object: 'users', api: 'me'}).$promise;
        promise.then(function(profileInfo) {
          if (!profileInfo) {
            deferred.reject(profileInfo);
            return;
          }
          // map few fields to be compatible with user service
          profileInfo.id = profileInfo.objectId;
          profileInfo.mobileVerified = profileInfo.isMobileVerified;
          cache.put(user.oID + 'ProfileInfo', profileInfo);
          profileInfo = completeProfile ? profileInfo :transformJSON(profileInfo);
          deferred.resolve(profileInfo);
        }, function(error) {
          deferred.reject(error);
        }); */

        return deferred.promise; 
      }; 

      var _updateProfileInfo = function(pInfo) {

        var deferred = $q.defer();

        // generate request payload
        var promise = _generateJSONForUpdate(pInfo);
        promise.then(function(payload) {
          // call parse api
          Parse.save({api: 'appUpdateProfile'}, payload).$promise.then(function(result) {
            deferred.resolve(result);
          }, function(error) {
            deferred.reject(error);
          });
        }, function() { deferred.reject({'status':'failed'});
        });

        return deferred.promise;
      };

      var _changePassword = function(email, password, newpassword) {

        var deferred = $q.defer();

        // validation added here to make controller flow simpler
        if(!password || !newpassword || !password.length ||
           !newpassword.length) {
          deferred.resolve({'result': {status : 'noupdate'}});
          return deferred.promise;
        }

        // generate request payload
        var payload = {};
        payload.username = email;
        payload.password = password;
        payload.newpassword = newpassword;

        // call parse api
        return Parse.save({api: 'webChangePassword'}, payload).$promise;

      };

     

      return {
        getProfileInfo : function() { return _getProfileInfo(false, false); },
        getCompleteProfile : function() { return _getProfileInfo(true, true); },
        updateProfileInfo : _updateProfileInfo,
        changePassword : _changePassword
       
      };


  }]);

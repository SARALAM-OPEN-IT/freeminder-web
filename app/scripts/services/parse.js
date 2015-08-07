'use strict';

/**
 * @ngdoc service
 * @name freeminderApp.parse
 * @description
 * # parse
 * Factory in the freeminderApp.
 */
angular.module('freeminderApp')
  .factory('Parse', ['$resource', '$log', 'configuration', '$rootScope', '$window',
    function($resource, $log, config, $scope, $window) {
        
    
    var sToken = '';
      //get session token when user is updated
      $scope.$on('user:updated', function(e, o) {
        sToken = o.sToken;
      });

      var _getSessionToken = function() {
        return sToken.length ? sToken : null;
      };

      //Ref: https://msdn.microsoft.com/en-us/library/ms537509(v=vs.85).aspx
      function getIEVersion() {
        var ua = $window.navigator.userAgent,
            appName = $window.navigator.appName,
            re = new RegExp('MSIE ([0-9]{1,}[\.0-9]{0,})'),
            rv = -1;
        if(appName === 'Microsoft Internet Explorer' && re.exec(ua) !== null ) {
          rv = parseFloat( RegExp.$1 );
        }
        return rv;
      }

      //Checking withCredentials in XHR is failing
      //Falling back to UA based detection
      //Below detection will not work for IE11 and above as MS removed MSIE from UA
      function needParseProxy() {
        var bRet = false, iever = getIEVersion();

        if(iever > -1 && iever >= 9.0 && iever < 10) {
          bRet = true;
        }
        $log.debug('Proxy parse request ' + (bRet ? 'needed' : 'not needed'));
        return bRet;
      }

      var _reqHeaders = {
        'X-Parse-Application-Id' : config.appID,
        'X-Parse-REST-API-Key' : config.parseKey,
        'X-Parse-Session-Token' : _getSessionToken
      }, _defPayload = {
        'cv' : config.clientVersion
      };

      //For IE9 proxy parse request
      var parseBaseURL = 'https://api.parse.com';
      if(config.proxyParseAPI && needParseProxy()) {
        parseBaseURL = config.proxyParseAPIPrefix;
      }

      var _parseResource =  $resource(parseBaseURL + '/1/:object/:api', { object: 'functions' }, {
          save: { method : 'POST', headers : _reqHeaders, paramSerializer: '$httpParamSerializerJQLike'},
          query: { method: 'GET', headers: _reqHeaders, paramSerializer: '$httpParamSerializerJQLike'},
          put: { method: 'PUT', headers: _reqHeaders, paramSerializer: '$httpParamSerializerJQLike'}
        });

      var _updatedPayload = function(reqPayload) {
          reqPayload = reqPayload || {};
          //Add default value to the payload
          angular.extend(reqPayload, _defPayload);
          return reqPayload;
      };

      return {
        save : function(params, reqPayload, success, error) {
          if(!params) {
            $log.debug('Required field params is undefined');
          }
          return _parseResource.save(params, _updatedPayload(reqPayload), success, error);
        },
        query: function(params, reqPayload, success, error) {
          if(!params) {
            $log.debug('Required field params is undefined');
          }
          return _parseResource.query(params, _updatedPayload(reqPayload), success, error);
        },
        put: function(params, reqPayload, success, error) {
          if(!params) {
            $log.debug('Required field params is undefined');
          }
          return _parseResource.put(params, _updatedPayload(reqPayload), success, error);
        }
      };
        
        
        
  }]);

'use strict';

/**
 * @ngdoc service
 * @name freeminderApp.userservice
 * @description
 * # userservice
 * Service in the freeminderApp.
 */
angular.module('freeminderApp')
  .service('userService', ['$rootScope', '$http', '$q', '$log', '$timeout', '$window', 'configuration', 'Parse', 'Facebook', '$filter', function ( $rootScope, $http, $q, $log, $timeout, $window, config, Parse, Facebook, $filter) {
      
    // AngularJS will instantiate a singleton by calling "new" on this function
    
      
    var _defUser = {  //Default user object
          'isLoggedIn' : false,
          'isFBUser' : false,
          'name': '',
          'email': '',
          'emailVerified': false,
          'mobile': '',
          'mobileVerified': false,
          'profilePic': '',
          'oID': '',
          'sToken': '',
          'firstName': '',
          'lastName': '',
          'initials': '',
          'walletBalance': 0,
          'datastore': {},
        },
        user = {},    //cached user info
        fbReady = false, $ = $window.jQuery;
      
      
        var customerList = [];
        var selectedContact = {};

    function ObjResult(sts, code, swCode, msg) {
      this.sts = sts || false;
      this.code = code || 1;
      this.msg = msg || 'Unable to process your request at this time. Please try again later.';
      this.swCode = -1;
      if(angular.isDefined(swCode)) {
        this.swCode = swCode;
      }
    }
    function _defResult() {
      /*Default result object*/
      return new ObjResult();
    }
    //Using merge for recursive copy and avoid object reference
    angular.merge(user, _defUser);

    //Notify changes in user data to all listeners
    function _userStatusNotify() {
      $rootScope.$broadcast('user:updated', user);
    }

    function _updateLoggedInStatus() {
      user.isLoggedIn = (user.isFBUser) || ( (user.email.length && user.emailVerified) || (user.mobile.length && user.mobileVerified) );
    }

    //Update user info from Parse API response
    function _updateUserInfo(u, bNotify) {
      if(angular.isUndefined(bNotify)) {
        bNotify = true;
      }
    
      user.email = u.email || '';
      user.mobile = u.mobile || '';
      user.name = u.username || '';
      user.oID = u.objectId;
      user.sToken = u.session || user.sToken;
      user.emailVerified = u.emailVerified;
      user.mobileVerified = u.mobileVerified || false;
     
      /* jshint -W106 */
      //web_balance is from back-end response & ignore from jsHint
      if(angular.isObject(u.web_balance)) {
        user.walletBalance = u.web_balance.balance || 0;
      }
      /* jshint +W106 */
      //store data store & other info
      _updateUserProfile(u);
      _updateLoggedInStatus();
      if(bNotify) {
        _userStatusNotify();
      }
    }

    function _updateUserProfile(o) {
      if(angular.isUndefined(o) || !angular.isObject(o)){
        return;
      }
      if(angular.isDefined(o.datastore)) {
        angular.merge(user.datastore, o.datastore);
        if(angular.isDefined(user.datastore.account)){
          user.firstName = user.datastore.account.firstName || '';
          user.lastName = user.datastore.account.lastName || '';
          if(user.firstName.length && user.lastName.length) {
            user.initials = (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
          }else {
            user.initials = '';
          }
        }
      }
      user.profilePic = o.image || user.profilePic;
    }

    function _parseErrorResponse(o) {
      //parse error response and return in expected format
      var ret = _defResult(), err = {};

      //if you got the same object (return value from local utility function)
      //return as it is.
      if(angular.isDefined(o.sts)) {
        return o;
      }

      if(o.code) {
        ret.code = o.code;
      }
      if(angular.isString(o.result)) {
        ret.msg = o.result;
        return ret;
      }
      if(angular.isUndefined(o.error)){
        return ret;
      }

      //error message is returned as string instead of object occasionally :(
      if(angular.isObject(o.error) && o.error.message){
        ret.msg = o.error.message;
      } else if(angular.isString(o.error)){
        ret.msg = o.error;
        if(o.error.match(/^JSON:/)) {
          ret.msg = o.error.replace(/^JSON:/,'');
        }

        try {
          err = angular.fromJson(ret.msg);
          if(err && (err.details || err.message||err.status)) {
            ret.msg = (err.details || err.message || err.status);
          }
          ret.swCode = err.code || -1;
        }catch(e){}
      }

      //remove some default text.
      ret.msg = ret.msg.replace(/^Request failed with response: /,'');
      return ret;
    }

    function _signup(email, password, mobile, username, service_name) {
      email = email || '';
      password = password || '';
      mobile = mobile || '';
      email = email.toLowerCase();

      var ret = _defResult(), d = $q.defer();

      //Basic validation
      if(!email.length || !password.length || !mobile.length ) {
        ret.msg = 'Invalid Input!';
        //reject via timeout for indicator to receive rejection
        $timeout(function() {
          d.reject(ret);
        }, 0);
        return d.promise;
      }

      //Perform email & mobile validation
      $timeout(function() {
        d.notify('validating');
      },0);
        
        var o = {
          'email' : email,
          'password': password,
          'mobile': mobile,
          'username' : username,
          'service' : service_name
          
        };
        Parse.save({api: 'appSignup'}, o).$promise.then(function(data){
        $log.debug('Login response ' + JSON.stringify(data));
        if(angular.isUndefined(data.result) || data.result.status !== 'success') {
          d.reject(ret);
        }
        /*Update all user info*/
        _updateUserInfo(data.result.user);
        ret.sts = true;
        d.resolve(user);
      }).catch(function(r){
        ret = _parseErrorResponse(r.data||r);
        d.reject(ret);
      }).finally(function(){
        d.reject(ret);
      }, function(s) {
        //proxy the notification
        if(angular.isString(s) && s.length) {
          d.notify(s);
        }
      });

      //always return deferred object
      return d.promise;

     
    }

    function _login(username, password) {
      //normalize input
      username = username || '';
      password = password || '';
   
      username = username.toLowerCase();  //email address should be case-insensitive here.

      var ret = _defResult(), d = $q.defer();

      //input validation
      //validation as per rule, should be done in the controller. We do
      //minimum empty check here.
      if(!username.length || !password.length) {
        ret.msg = 'Invalid input!';
        //reject via timeout for indicator to receive rejection
        $timeout(function() {
          d.reject(ret);
        }, 0);
        return d.promise;
      }

      //set progress
      //As this is before we return promise, wrap it in timeout
      $timeout(function() {
        d.notify('Logging in');
      }, 0);
      var o = {
        'username': username,
        'password': password
       
      };

      //send ajax form submission
      Parse.save({api: 'appLogin'}, o).$promise.then(function(data){
        $log.debug('Login response ' + JSON.stringify(data));
        if(angular.isUndefined(data.result) || data.result.status !== 'success') {
          d.reject(ret);
        }
        /*Update all user info*/
        _updateUserInfo(data.result.user);
        ret.sts = true;
        d.resolve(user);
      }).catch(function(r){
        ret = _parseErrorResponse(r.data||r);
        d.reject(ret);
      }).finally(function(){
        d.reject(ret);
      }, function(s) {
        //proxy the notification
        if(angular.isString(s) && s.length) {
          d.notify(s);
        }
      });

      //always return deferred object
      return d.promise;
    }

    function _verifyMobile(code) {
      var ret = _defResult(), d = $q.defer();

      code = code || 0;
      //pre-check
      if(!code || !user.oID.length || user.mobileVerified) {
        $log.debug('Code: ' + code.length + ' user: ' + user.oID.length);
        $timeout(function() {
          d.reject(ret);
        }, 0);
        return d.promise;
      }

      var o = {
        'userId' : user.oID,
        'code' : code
      }, $req = Parse.save({api: 'appVerifyMobileCode'}, o).$promise;

      $timeout(function() {
        d.notify('Validating');
      }, 0);
      $req.then(function(data){
        $log.debug('On mobile validation ' + angular.toJson(data));
        //store the status locally
        user.mobileVerified = true;
        _updateLoggedInStatus();
        _userStatusNotify();

        ret.sts = true;
        ret.msg = data.result.status;
        d.resolve(ret);
      },function(r){
        $log.debug('On mobile validation failed ' + angular.toJson(r));
        ret = _parseErrorResponse(r.data||r);
        d.reject(ret);
      });

      return d.promise;
    }
    function _resendMobileVerificationCode() {
      var ret = _defResult(), d = $q.defer();

      //pre-check
      if(!user.oID.length || user.mobileVerified) {
        $timeout(function() {
          d.reject(ret);
        }, 0);
        return d.promise;
      }

      var o = {
        'userId': user.oID
      };

      $timeout(function() {
        d.notify('Sending Mobile verification Code');
      }, 0);
      Parse.save({api: 'appResendMobileVerificationCode'}, o).$promise
        .then(function(data) {
        ret = _parseErrorResponse(data);
        ret.sts = true;
        d.resolve(ret);
      }, function(r) {
        ret = _parseErrorResponse(r.data);
        d.reject(ret);
      });
      return d.promise;
    }
    function _signout() {
      var ret = _defResult(), d = $q.defer(), p = d.promise;

      //pre-check
      if(!user.oID.length) {
        $timeout(function() {
          d.reject(ret);
        }, 0);
        return p;
      }

      //signout the user
      Parse.save({api: '', object: 'logout'}).$promise
      .finally(function() {
        //irrespective of success or failure status
        //delete the object
        angular.extend(user, _defUser);
        ret.sts = true;
        ret.msg = '';
        d.resolve(ret);
        _updateLoggedInStatus();
        _userStatusNotify();
      });
      return p;
    }

    function _fetchUserProfile() {
      var ret = _defResult(), d = $q.defer(), p = d.promise;
      if(!user.oID.length || !user.email.length) {
        //first user should be loggedin to get profile info
        $timeout(function() {
          d.reject(ret);
        }, 0);
        return p;
      }

      var o = {
        'email' : user.email
      };
      //user is logged in. Let's get profile info
      $timeout(function() {
        d.notify('Getting profile');
      }, 0);

      Parse.save({api: 'appGetUserDetailsFromEmail'}, o).$promise
      .then(function(data) {
        $log.debug('Got the profile ' + JSON.stringify(data));
        //successfully got profile info
        if(!data || angular.isUndefined(data.result)) {
          d.reject(ret);
          return;
        }
        //_saveUserProfile(data);
        //On success return updated user profile object
        _updateUserProfile(data.result);
        _userStatusNotify();
        d.resolve(user);
      }, function(r) {
        //failure callback
        ret = _parseErrorResponse(r.data|| r);
        d.reject(ret);
      });
      return p;
    }
    function _forgotPassword(email) {
      var ret = _defResult(), d = $q.defer(), p = d.promise;
      email = email || '';
      email = email.toLowerCase();
      //basic validation check & user shouldn't be logged in
      if(!email.length || user.isLoggedIn) {
        $timeout(function() {
          d.reject(ret);
        }, 0);
        return p;
      }

      $timeout(function() {
        d.notify('Requesting for password reset');
      }, 0);
      //send Parse API request
      Parse.save({object: 'requestPasswordReset', api: ''}, {
        'email': email
      }).$promise.then(function() {
        //we get empty response here.
        ret.sts = true;
        d.resolve(ret);
      }, function(r) {
        ret = _parseErrorResponse(r.data || r);
        d.reject(ret);
      });
      return p;
    }

    /*Facebook related handler*/
    fbReady = Facebook.isReady();
    //if FB is not loaded yet, let's monitor for it's status
    if(!fbReady) {
      var unbindFbWatch = $rootScope.$watch(function() {
        return Facebook.isReady();
      }, function(newVal) {
        fbReady = newVal;
        if(newVal) {
          //FB SDK is loaded, we don't need to watch anymore
          unbindFbWatch();
        }
      });
    }

    /* sample user object obtained from Facebook
                      {"id":"10153468797737360","email":"marikanti@gmail.com","first_name":"Hanumantha","gender":"male","last_name":"Marikanti","link":"https://www.facebook.com/app_scoped_user_id/10153468797737360/","locale":"en_US","name":"Hanumantha Marikanti","timezone":6.5,"updated_time":"2013-12-24T09:53:10+0000","verified":true}

    */
    /* Sample authResponse object obtained from Facebook
            {"accessToken":"CAAXMe67dkpkBAEeZBHv5glPY6R0TdXxOaIq6o72O1jutt1ojApsZAi590079na3pvP","userID":"10153468797737360","expiresIn":6530,"signedRequest":"B5p0vExqQxNXKhJlmV2SFF4ZlheUxUdWFPb2IsImlzcpZCI6IjEwMTUzNDY4Nzk3NzM3MzYwIn0"}"

    */
    //Note: angular-facebook provides $q promise for all FB APIs.
    //But they work only if we pass a function. Since we want to handle
    //response in promise callback, we need to pass dummy fn here (angular.noop)
    var reqPermissions = ['email', 'public_profile'/*, 'user_about_me'*/],  //List of FB permission we need
        fbAuthData = {};
    function _fbPreLoginCheck(bValidate) {
      bValidate = bValidate || false;

      /*We will be validating cached response during login*/
      if(bValidate && $.isEmptyObject(fbAuthData)) {
        return $q.reject();
      }
      //empty previously stored fbAuthData
      fbAuthData = {};

      //Let's get Facebook login status
      return Facebook.getLoginStatus(angular.noop).then(function(rData) {
        $log.debug('On FB login status ' + JSON.stringify(rData));
        if(rData.status === 'connected') {
          fbAuthData = rData;
          //user is loggedin to facebook and connected with our app
          //Let's check whether we have necessary permissions
          return Facebook.api('/me/permissions', angular.noop);
        }

        //User is not loggedin to facebook or our app is not connected yet
        return $q.reject();
      }).then(function(rData) {
        //$log.debug('On permissions ' + JSON.stringify(rData));
        //Let's check whether user granted all the permissions we require
        var grantedPerms = $.map(rData.data, function(v) {
          if(v.status === 'granted') {
            return v.permission;
          }
        });

        $log.debug('Granted perms ' + grantedPerms.join(','));
        var bGranted = true;
        $.each(reqPermissions, function(i, v) {
          if(grantedPerms.indexOf(v) === -1) {
            //we are missing one of the required permission
            bGranted = false;
          }
        });
        if(!bGranted) {
          //reset the stored local data and go through FB login again
          fbAuthData = {};
          return $q.reject(false);
        }
        $q.resolve(fbAuthData);
      });

    }
    function _fbLogin(bSignup) {
      //if nothing passed, it's login request
      bSignup = bSignup || false;
      var ret = _defResult(), d = $q.defer(), p = d.promise;
      //pre-check
      //if user is already loggedin, ignore this
      //FB SDK should've been loaded
      if(user.oID.length || !fbReady) {
        $timeout(function() {
          d.reject(ret);
        },0);
        return p;
      }

      $timeout(function() {
        d.notify((bSignup ? 'Signing up with Facebook' : 'Logging in with Facebook'));
      }, 0);

      _fbPreLoginCheck(true).then(function() {
        //We have cached fbData & it's valid
        return $q.resolve(fbAuthData);
      }, function() {
        var d = $q.defer(), p = d.promise;
        //User is either not authenticated or doesn't have enough permission
        Facebook.login(function(response) {
          d.resolve(response);
        },{
          'scope': reqPermissions.join(','),
          'return_scopes': true,
          'auth_type': 'rerequest'
        });
        return p;
      }).then(function(rData) {
        //Successfully loggedin with FB and FB info available.
        $log.debug('On FB successful Login ' + JSON.stringify(rData));
        if(rData.status === 'unknown' || rData.authResponse === null ||rData.status === 'not_authorized' ) {
          ret.msg = 'Unable to login with Facebook';
          d.reject(ret);
          return;
        }
        fbAuthData = rData;

        //Let's communicate with parse and login/signup the user
        //Format date & request object
        //expires_in is expiration in seconds from now
        /* jshint -W109,-W106 */
        var o = {
          facebook: {
            id: rData.authResponse.userID,
            access_token: rData.authResponse.accessToken,
            expiration_date: $filter('date')(Date.now() + rData.authResponse.expiresIn * 1000, "yyyy-MM-ddTHH:mm:ss.sss'Z'", 'GMT')
          }
        }, parseAPI = bSignup ? 'webFacebookSignUp' : 'webFacebookLogin';
        /* jshint +W109,+W106 */

        $log.debug('FB input object - ' + JSON.stringify(o));
        return Parse.save({api : parseAPI}, o).$promise;
      }).then(function(data) {

        $log.debug('FB signup response ' + JSON.stringify(data));
        if(angular.isUndefined(data) || angular.isUndefined(data.result) || data.result.status !== 'success') {
          d.reject(ret);
          return;
        }
        /*Update all user info*/
        user.isFBUser = true;
        _updateUserInfo(data.result);
        ret.sts = true;
        d.resolve(user);
      }).catch(function(r) {
        //Exception/error handler for all
        $log.debug('On FB catchall ' + JSON.stringify(r));
        ret = _parseErrorResponse(r.data || r);
        d.reject(ret);
      }).finally(function(){
        //if we are reaching here, it's unexpected success/error handler
        //We shouldn't use cached fbAuthData again
        fbAuthData = {};
        d.reject(ret);
      }, function(s) {
        //proxy the notification
        if(angular.isString(s) && s.length) {
          d.notify(s);
        }
      });

      return p;
    }
      
      
    function _getCustomerList(handleSuccess, handleError) {
     
       var ret = _defResult(), d = $q.defer();
        
      if (!user.isLoggedIn) {
        handleError('User not logged in..');
        return;
      }
        
    
      if(customerList.length !== 0) {
          handleSuccess("success");
          return;

      }
        
      $timeout(function() {
        d.notify('Fetching contacts..');
      }, 0);
         
      var o = {
        'parentId': user.oID
    
      };

      //send ajax form submission
      Parse.save({api: 'getCustomers'}, o).$promise.then(function(data){
        $log.debug('get customer response ' + JSON.stringify(data));
        if(angular.isUndefined(data.result) || data.result.status !== 'success') {
            handleError(data.result);
        }
        /*Update all user info*/
        
        data.result.customers.forEach(function(customer) {
            customerList.push(customer);   
        
        });
       
        handleSuccess("success");
        
    
       
      }).catch(function(r){
          
        handleError(r);
      
      }).finally(function(){
          
      });

    }
      
      
    function _saveContact(objectId, parentId, email, mobile, username, service_name, actions) {
      email = email || '';
      mobile = mobile || '';
      email = email.toLowerCase();
      username = username || '';
      objectId = objectId || '';

      var ret = _defResult(), d = $q.defer();

      //Basic validation
      if(!email.length || !username.length || !mobile.length ) { //|| !parentId.length) {
        ret.msg = 'Invalid Input!';
        //reject via timeout for indicator to receive rejection
        $timeout(function() {
          d.reject(ret);
        }, 0);
        return d.promise;
      }

      //Perform email & mobile validation
      $timeout(function() {
        d.notify('Saving Contact ');
      },0);
        
        var o = {
          'objectId':objectId || '',
          'parentId':parentId,
          'email' : email,
          'mobile': mobile,
          'username' : username,
          'service' : service_name
          
        };
        
      
        Parse.save({api: 'saveContact'}, o).$promise.then(function(data){
            $log.debug('Save Contact response ' + JSON.stringify(data));
            if(angular.isUndefined(data.result) || data.result.status !== 'success') {
                d.reject(ret);
            }
            /*Update all user info*/
            if(!objectId.length) {
                customerList.push(data.result.customer);
            }
            //save actions
            actions.forEach(function(action) {
                
                var dom, service, frequency;
                console.log('saving action ..' + action.objectId);
                if(action.dom.id === 0) {
                    dom = '1';
                }
                
                if(action.service.id === 0 ) {
                    
                    service = 'OTHER SUBSCRIPTIONS';
                }
                
                if(action.frequency.id === 0) {
                    frequency = 'monthly';   
                }
                
                var a = {
                    'objectId' : action.objectId,
                    'parentId' : data.result.customer.objectId,
                    'name' : action.action_name,
                    'email' : action.action_email ? 'true' : 'false',
                    'sms' : action.action_sms ? 'true' : 'false',
                    'voice' : action.action_voice ? 'true' : 'false',
                    'action_text': action.action_text,
                    'start': action.start,
                    'end': action.end,
                    'service' : action.service.name,
                    'dom' : action.dom.name,
                    'frequency' : action.frequency.name,
                    'runonsave' : 'false'
                    
                };
               console.log(a);
               Parse.save({api: 'saveAction'}, a).$promise.then(function(data){
                   $log.debug('after save action' + JSON.stringify(data));
                   
               }).catch(function(r){
                   console.log('Unable save action'+ r.data);
                   
               });
            });
      
            ret.sts = true;
            d.resolve(user);
      }).catch(function(r){
        ret = _parseErrorResponse(r.data||r);
        d.reject(ret);
      }).finally(function(){
        d.reject(ret);
      }, function(s) {
        //proxy the notification
        if(angular.isString(s) && s.length) {
          d.notify(s);
        }
      });

      //always return deferred object
      return d.promise;

     
    }

      
    function _importCSV(parentId, fileContent) {
      parentId = parentId || '';
      fileContent = fileContent || '';

      var ret = _defResult(), d = $q.defer();
      $log.debug('Before import ' + parentId +  fileContent);
      //Basic validation
      if(!parentId.length ) {
        ret.msg = 'Invalid Input!';
        //reject via timeout for indicator to receive rejection
        $timeout(function() {
          d.reject(ret);
        }, 0);
        return d.promise;
      }

      //Perform email & mobile validation
      $timeout(function() {
        d.notify('Importing');
      },0);
    
        var lines = fileContent.split("\n");
        lines.forEach(function(line) {
           var fields = line.split(",");
            
                var o = {
                      'parentId':parentId,
                      'email' : fields[1],
                      'mobile': fields[2],
                      'username' : fields[0],
                      'service' : fields[3]

                };
            
                Parse.save({api: 'saveContact'}, o).$promise.then(function(data){
                    $log.debug('Save Contact response ' + JSON.stringify(data));
                    if(angular.isUndefined(data.result) || data.result.status !== 'success') {
                        d.reject(ret);
                    }
                    /*Update all user info*/
                    customerList.push(data.result.customer);

                    ret.sts = true;
                    d.resolve(user);
                    }).catch(function(r){
                        ret = _parseErrorResponse(r.data||r);
                        d.reject(ret);
                    }).finally(function(){
                        d.reject(ret);
                    }, function(s) {
                    //proxy the notification
                    if(angular.isString(s) && s.length) {
                      d.notify(s);
                    }
                });
            
      
        });
        
        //always return deferred object
      return d.promise;

     
    }
      
    function _setSelectedContact (contact) {
        
        //angular.merge(selectedContact, contact);
        for(var key in contact) {
         selectedContact[key] = contact[key];   
        }
        console.log("selectd " + selectedContact.email);
    }
      
      
    function _getSelectedContact () {
        
        return selectedContact;
        
    }
      
    function _removeContact(contact) {
        
        console.log('removing contact ' + contact.objectId);
        
        //normalize input
        var objectId = contact.objectId || '';
   
        var ret = _defResult(), d = $q.defer();

        //input validation
        //validation as per rule, should be done in the controller. We do
        //minimum empty check here.
        if(!objectId.length) {
            ret.msg = 'Invalid input!';
            //reject via timeout for indicator to receive rejection
            $timeout(function() {
                d.reject(ret);
            }, 0);
            return d.promise;
        }

        var o = {
            'customerId': objectId
        };

        //send ajax form submission
        Parse.save({api: 'deleteCustomer'}, o).$promise.then(function(data){
            $log.debug(' response ' + JSON.stringify(data));
            if(angular.isUndefined(data.result) || data.result.status !== 'success') {
              d.reject(ret);
            }
            /*Update all user info*/
            
            ret.sts = true;
            d.resolve(user);
          }).catch(function(r){
            ret = _parseErrorResponse(r.data||r);
            d.reject(ret);
          }).finally(function(){
            d.reject(ret);
          }, function(s) {
            //proxy the notification
            if(angular.isString(s) && s.length) {
              d.notify(s);
            }
          });

          //always return deferred object
          return d.promise;

        
    }
      
      
    function _getActions(parentId) {
        console.log('getiing action for ' + parentId);
        
        //normalize input
        var parentId = parentId || '';
   
        var ret = _defResult(), d = $q.defer();

        if(!parentId.length) {
            ret.msg = 'Invalid input!';
            //reject via timeout for indicator to receive rejection
            $timeout(function() {
            d.reject(ret);
            }, 0);
            return d.promise;
        }
        var o = {
            'parentId': parentId
        };

        Parse.save({api: 'getActions'}, o).$promise.then(function(data){
            $log.debug(' response ' + JSON.stringify(data));
            
            if(angular.isUndefined(data.result)) {
              d.reject(ret);
            }
            ret.sts = true;
            d.resolve(data.result);
          }).catch(function(r){
            ret = _parseErrorResponse(r.data||r);
            d.reject(ret);
          }).finally(function(){
            d.reject(ret);
          }, function(s) {
            //proxy the notification
            if(angular.isString(s) && s.length) {
              d.notify(s);
            }
          });

          //always return deferred object
          return d.promise;
    }
      
      
    function _removeAction(objectId) {
        console.log('removing action for ' + objectId);
        
        //normalize input
        var objectId = objectId || '';
   
        var ret = _defResult(), d = $q.defer();

        if(!objectId.length) {
            ret.msg = 'Invalid input!';
            //reject via timeout for indicator to receive rejection
            $timeout(function() {
            d.reject(ret);
            }, 0);
            return d.promise;
        }
        var o = {
            'objectId': objectId
        };

        Parse.save({api: 'removeAction'}, o).$promise.then(function(data){
            $log.debug(' response ' + JSON.stringify(data));
            
            if(angular.isUndefined(data.result)) {
              d.reject(ret);
            }
            ret.sts = true;
            d.resolve(data.result);
          }).catch(function(r){
            ret = _parseErrorResponse(r.data||r);
            d.reject(ret);
          }).finally(function(){
            d.reject(ret);
          }, function(s) {
            //proxy the notification
            if(angular.isString(s) && s.length) {
              d.notify(s);
            }
          });

          //always return deferred object
          return d.promise;
    }




    return {
      isLoggedIn: function() { return user.isLoggedIn; },
      isFBReady: function() { return fbReady;},
      getSessionToken: function() { return user.sToken;},
      getUser: function() {return user;},
      getCustomers: function() {return customerList;},
      signup: _signup,
      login: _login,
      fbLogin: _fbLogin,
      fbPreLoginCheck: _fbPreLoginCheck,
      verifyMobile: _verifyMobile,
      resendMobileVerificationCode: _resendMobileVerificationCode,
      signout: _signout,
      fetchUserProfile: _fetchUserProfile,
      forgotPassword: _forgotPassword,
      updateUserInfo: _updateUserInfo,
      parseErrorResponse: _parseErrorResponse,
      getCustomerList: _getCustomerList,
      saveContact: _saveContact,
      importCSV: _importCSV,
      setSelectedContact: _setSelectedContact,
      getSelectedContact: _getSelectedContact,
      removeContact: _removeContact,
      getActions: _getActions,
      removeAction: _removeAction,
    };

    
    
  }]);

'use strict';

/**
 * @ngdoc function
 * @name freeminderApp.controller:SignupCtrl
 * @description
 * # SignupCtrl
 * Controller of the freeminderApp
 */
angular.module('freeminderApp')
  .controller('SignupCtrl', ['$scope', '$window', '$location', '$log', 'userService', 'Facebook', 'configuration',
    function($scope, $window, $location, $log, userService, Facebook, Config) {

    $scope.errMsg = '';
    $scope.lPromise = null;
    $scope.lMessage = '';
    $scope.errEmail = 'Enter a valid email';
    $scope.errPwd ='Password must be 6 character long';
    $scope.errPhone = 'Please enter 10 digit phone number';
    $scope.showFBLogin = true; //Config.enableFB;


    $scope.service_list = [

      {id:0, name:'Select Service' },
      {id:1, name:'GYM'},
      {id:2, name:'EDUCATION'},
      {id:3, name:'MOTOR SERVICE'},
      {id:4, name:'INSURANCE'},
      {id:5, name:'LEGAL'},
      {id:6, name:'COMMUNITY'},
      {id:7, name:'MEDICAL'},
      {id:8, name:'DIAGNOSTIC CENTER'},
      {id:9, name:'HOME'},
      {id:10, name:'CABLE/INTERNET SERVICE'},
      {id:11, name:'OTHER SUBSCRIPTIONS'},

    ];
    $scope.service_name = $scope.service_list[2];

    /* sample user object obtained from Facebook
                      {"id":"10153468797737360","email":"marikanti@gmail.com","first_name":"Hanumantha","gender":"male","last_name":"Marikanti","link":"https://www.facebook.com/app_scoped_user_id/10153468797737360/","locale":"en_US","name":"Hanumantha Marikanti","timezone":6.5,"updated_time":"2013-12-24T09:53:10+0000","verified":true}

    */

    $scope.user = {};
    $scope.logged = false;

    /* Sample authResponse object obtained from Facebook
            {"accessToken":"CAAXMe67dkpkBAEeZBHv5glPY6R0TdXxOaIq6o72O1jutt1ojApsZAi590079na3pvP","userID":"10153468797737360","expiresIn":6530,"signedRequest":"B5p0vExqQxNXKhJlmV2SFF4ZlheUxUdWFPb2IsImlzcpZCI6IjEwMTUzNDY4Nzk3NzM3MzYwIn0"}"

    */
    $scope.authData = {};

    // Defining user logged status
    $scope.logged = false;

    /*Simple signup flow*/
    //Widget callback and store widget ID


    $scope.submitForm = function() {
      //clear the error message first
      $scope.errMsg = '';
      $scope.lMessage = '';
      //get captcha response
      var captchaValue = '';
      $log.debug('Before signup ' + $scope.email, $scope.mobile + $scope.service_name.name);
      $scope.lPromise = userService.signup($scope.email, $scope.passwd, $scope.mobile, $scope.user_name, $scope.service_name.name);

      $scope.lPromise.then(function(u) {
        //success callback
        $log.debug('After signup ' + JSON.stringify(u));

        $location.path('/customer-list');
      }, function(r) {
          //error callback
        $log.debug('Signup failed ' + JSON.stringify(r));
        $scope.errMsg = r.msg;
        //on failure reset the captcha widget as it can't be re-used

      }, function(s) {
        $scope.lMessage = s;
      }).finally(function() {
        //google recaptcha causes input element
        //in IE not to display any updated text.
        //setting focus() seems to fix this issue
        $window.jQuery('input:first').focus();
      });
    };

    //Based on FB SDK, enable/disable FB button
    //$scope.facebookReady = userService.isFBReady();
    $scope.facebookReady = false;
    //if the SDK is not loaded till now, let's monitor for it's status update
    if(!$scope.facebookReady) {
      var unbindFbWatch = $scope.$watch(function() {
        return userService.isFBReady();
      }, function(n) {
        $scope.facebookReady = n;
        if(n) {
          userService.fbPreLoginCheck();
          //FB is loaded & we don't need to watch anymore
          unbindFbWatch();
        }
      });
    } else {
      userService.fbPreLoginCheck();
    }

    $scope.loginWithFacebook = function() {
      $scope.errMsg = '';
      $scope.lMessage = '';
      //perform FB Login via userservice
      $scope.lPromise = userService.fbLogin(true);
      $scope.lPromise.then(function(u) {
        $log.debug('After successful FB login ' + JSON.stringify(u));
        $location.path('/shop');
      }, function(res) {
        //error callback & show the error message
        $log.debug('FB Login failed ' + JSON.stringify(res));
        $scope.errMsg = res.msg;
      }, function(s) {
        $log.debug('On progress ' + s);
        $scope.lMessage = s;
      });
      return false;
    };


  }]);

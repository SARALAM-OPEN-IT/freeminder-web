'use strict';

/**
 * @ngdoc function
 * @name freeminderApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Controller of the freeminderApp
 */
angular.module('freeminderApp')
  .controller('LoginCtrl', ['$scope', '$window', '$log', '$location', 'userService', 'Facebook', 'configuration',
    function ($scope,   $window,   $log,   $location,   userService,   Facebook,   Config) {
                       
 
    $scope.errMsg = '';
    $scope.lPromise = null;
    $scope.lMessage = '';
    $scope.recaptchaKey = Config.recaptchaKey;

    /*Simple user form signup*/
    var captchaID = 0;
    //Widget callback and store widget ID
    $scope.setWidgetId = function(w) {
      captchaID = w;
    };
    $scope.submitForm = function(){
      //clear error message
      $scope.errMsg = '';
      $scope.lMessage = '';

      //get captcha response

      //send a request to user service and submit the form
      $scope.lPromise = userService.login($scope.user, $scope.password);
      $scope.lPromise.then(function(u) {
        $log.debug('After successful login ' + JSON.stringify(u));
        //If mobile is not verified, rediret to mobile verify page
        //$location.path( u.mobileVerified ? '/shop' : '/verify-mobile');
        $location.path('/customer-list');
      }, function(res) {
        //error callback & show the error message
        $log.debug('Login failed ' + JSON.stringify(res));
        $scope.errMsg = res.msg;
        //on failure reset the captcha widget as it can't be re-used
       
      }, function(s) {
        $log.debug('On progress ' + s);
        $scope.lMessage = s;
      }).finally(function() {
        //google recaptcha causes input element
        //in IE not to display any updated text.
        //setting focus() seems to fix this issue
        $window.jQuery('input:first').focus();
      });
      return false;
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
      $scope.lPromise = userService.fbLogin();
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

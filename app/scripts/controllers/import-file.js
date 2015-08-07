'use strict';

/**
 * @ngdoc function
 * @name freeminderApp.controller:ImportFileCtrl
 * @description
 * # ImportFileCtrl
 * Controller of the freeminderApp
 */
angular.module('freeminderApp')
  .controller('ImportFileCtrl', ['$scope', '$window', '$location', '$log', 'userService', 'Facebook', 'configuration',
    function($scope, $window, $location, $log, userService, Facebook, Config) {
    
    //$scope.fileContent = '';
        
    var user = userService.getUser();
    $scope.rootUser = user;
    if(!$scope.rootUser) {
        $location.path("/login");
        
    }
    
    $scope.uploadFile = function () {
        
      $log.debug("My File importing");
       
      $scope.errMsg = '';
      $scope.lMessage = '';
      //get captcha response
      var captchaValue = '';
      $log.debug('Before Save ' + $scope.rootUser.oID +  $scope.fileContent);
      $scope.lPromise = userService.importCSV($scope.rootUser.oID, $scope.fileContent);
        
      $scope.lPromise.then(function(u) {
        //success callback
        $log.debug('After save ' + JSON.stringify(u));

        $location.path('/customer-list');
      }, function(r) {
          //error callback
        $log.debug('add contact failed ' + JSON.stringify(r));
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
       
        
        
    }

  }]);

'use strict';

/**
 * @ngdoc function
 * @name freeminderApp.controller:SysactionListCtrl
 * @description
 * # SysactionListCtrl
 * Controller of the freeminderApp
 */
angular.module('freeminderApp')
  .controller('SysactionListCtrl', ['$scope', 'userService', '$log', '$location', function ($scope, userService, $log, $location) {
    
    $scope.sysActions = [];
   
    var handleError = function (error) {
        // TODO: Error messaging
        $scope.noGcMsg = "There are currently no customer associated with you. Please try again later.";
        $log.debug("get customer list failed"+ error);
    };

    var handleSuccess = function (data) {
      
        $scope.sysActions = userService.getSystemActions();

    };
      
    console.log('Fetching system actions..');
      
    userService.getSystemActionList(handleSuccess, handleError);
      
    $scope.go = function (path) {
        $location.path( path );
    }

  }]);

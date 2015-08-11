'use strict';

/**
 * @ngdoc function
 * @name freeminderApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the freeminderApp
 */
angular.module('freeminderApp')
  .controller('MainCtrl', ['$scope', '$log', 'configuration', function ($scope, $log, config) {

  var handleError = function () {
    // TODO: Error messaging
    // console.log('Get EMP catalog failed');
  };

  var handleSuccess = function (data) {

  };

  //catalogService.getData(handleSuccess, handleError);
      
}]);

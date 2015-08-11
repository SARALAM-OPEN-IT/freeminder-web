'use strict';

/**
 * @ngdoc function
 * @name freeminderApp.controller:LeftnavCtrl
 * @description
 * # LeftnavCtrl
 * Controller of the freeminderApp
 */
angular.module('freeminderApp')
  .controller('LeftnavCtrl',  ['$scope', '$log', '$location', 'userService', function ($scope, $log, $location, userService) {
    $scope.isLoggedIn = userService.isLoggedIn();

    var user = userService.getUser();
    $scope.name = user.firstName || user.lastName || '';
    $scope.image = user.profilePic;
    $scope.initials = user.initials;

    //Watch for event when user info updated and update the above variables.
    $scope.$on('user:updated', function() {
      $scope.name = user.firstName || user.lastName || '';
      $scope.image = user.profilePic;
      $scope.initials = user.initials;
    });

    $scope.signout = function(){
      //signout the user
      userService.signout().finally(function() {
        //we don't need to worry whether it's success or failure
        //$log.debug('After logging out ' + JSON.stringify(userService.getUser()));
        $location.path('/shop');
      });
      return false;
    };

  }]);
  });

'use strict';

/**
 * @ngdoc function
 * @name freeminderApp.controller:HeaderCtrl
 * @description
 * # HeaderCtrl
 * Controller of the freeminderApp
 */
angular.module('freeminderApp')
  .controller('HeaderCtrl',  ['$scope', '$rootScope', '$window', '$log', '$location', 'userService', function ($scope, $rootScope, $window, $log, $location, userService) {

    $scope.isLoggedIn = userService.isLoggedIn();


    var user = userService.getUser(),
    $ = $window.jQuery; //store jQuery locally
    $scope.username = user.firstName || user.name;

    $scope.headerClass = ''; //class needs to be added to change header state
    $scope.loggedinClass = '';

    //Utility fn to update header mode
    function _UpdateHeaderMode() {

      var view = $location.path(),
          hdrOnlyViews = ['/login', '/signup'];
      //view always takes precedence
      if(hdrOnlyViews.indexOf(view) !== -1 ) {
        $scope.headerClass = 'logo-only-navbar';
        return;
      }
      //Now check loggedin state
      $scope.headerClass = ($scope.isLoggedIn ? 'loggedin-navbar' : '');

      //updated loggedin class, needed for width adjustment
      $scope.loggedinClass = ($scope.isLoggedIn ? 'loggedin-img-header' : '');


    }

    function collapseHeaderMenu() {
      //User navigate to new page. Hide navbar
      $('#sw-navbar-collapse').collapse('hide');
    }

    $scope.signout = function(){
      //signout the user
      userService.signout().finally(function() {
        //we don't need to worry whether it's success or failure
        $log.debug('After logging out ' + JSON.stringify(userService.getUser()));
        $location.path('/main');
      });
      collapseHeaderMenu();
      return false;
    };

    //Watch for event about cart & user info updated and update the above variables.
    $scope.$on('user:updated', function() {
      console.log('User update event' );

      var u = userService.getUser();
      $scope.isLoggedIn = u.isLoggedIn;
      $scope.username = u.firstName || u.name;


      _UpdateHeaderMode();
    });

    //Use rootscope to hide navbar (top & bottom) drop-down to collapse on navigation
    //since this is ajax navigation
    $rootScope.$on('$routeChangeSuccess', function() {
      collapseHeaderMenu();
      _UpdateHeaderMode();
      //Let's take him to top of the page.
      $('html, body').animate({scrollTop: 0});
    });

  }]);

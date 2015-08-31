'use strict';

/**
 * @ngdoc function
 * @name freeminderApp.controller:FooterCtrl
 * @description
 * # FooterCtrl
 * Controller of the freeminderApp
 */
angular.module('freeminderApp')
  .controller('FooterCtrl', ['$scope', '$rootScope', '$location', 'configuration', function ($scope, $rootScope, $location, config) {
    $scope.footerClass = 'no-footer-navbar';
    $scope.footerVersion = config.clientVersion;
    $scope.cuurentYear = new Date().getFullYear();

  function _UpdateFooterMode() {
    var noFooterViews = ['/forgotpassword', '/login', '/signup'],
        noAppViews = ['/main', '/download/', '/'],
        view = $location.path();
    //set required class based on active view
    if( noFooterViews.indexOf(view) !== -1 ) {
      $scope.footerClass = 'no-footer-navbar';
    } else if(noAppViews.indexOf(view) !== -1) {
      $scope.footerClass = 'noapp-footer-navbar';
    }else {
      $scope.footerClass = '';
    }

    //On download page, we need footer to have white background
    if(view.indexOf('/download') !== -1) {
      $scope.footerClass = $scope.footerClass + ' whitebg-footer-navbar';
    }
  }
  //Use rootscope to hide navbar (top & bottom) drop-down to collapse on navigation
  //since this is ajax navigation
  $rootScope.$on('$routeChangeSuccess', function() {
    _UpdateFooterMode();
  });

  }]);

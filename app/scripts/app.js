'use strict';

/**
 * @ngdoc overview
 * @name freeminderApp
 * @description
 * # freeminderApp
 *
 * Main module of the application.
 */
angular
  .module('freeminderApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'angular-google-analytics',
    'cgBusy',
    'facebook',
    'ui.date'
    
  ])
 .config(['$routeProvider', 'AnalyticsProvider', '$logProvider', '$compileProvider', 'configuration', 'FacebookProvider', function ($routeProvider, AnalyticsProvider, $logProvider, $compileProvider, config, FacebookProvider) {
    
    //enable/disable debugging based on config
    $logProvider.debugEnabled(config.debug);
    //enable/disable AngularJS debugging data
    $compileProvider.debugInfoEnabled(config.debug);

    //init the facebook app
    var myAppId = config.fbAppId; //'1632206470353561'
    //FacebookProvider.init(myAppId);
    FacebookProvider.init({
      appId: myAppId,
      version: 'v2.4',  //Facebook API version
      status: true,      //Check login status at startup
      xfbml: false      //we are not using xfbml tags to render FB plug-in code
    }, true);
    
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'about'
      })
      .when('/signup', {
        templateUrl: 'views/signup.html',
        controller: 'SignupCtrl',
        controllerAs: 'signup'
      })
      .when('/login', {
        templateUrl: 'views/login.html',
        controller: 'LoginCtrl',
        controllerAs: 'login'
      })
      .when('/customer-list', {
        templateUrl: 'views/customer-list.html',
        controller: 'CustomerListCtrl',
        controllerAs: 'customerList',
        requireLogin: true
      })
      .when('/edit-contact', {
        templateUrl: 'views/edit-contact.html',
        controller: 'EditContactCtrl',
        controllerAs: 'editContact',
        requireLogin: true
      })
      .when('/import-file', {
        templateUrl: 'views/import-file.html',
        controller: 'ImportFileCtrl',
        controllerAs: 'importFile',
        requireLogin: true
      })
      .when('/add-action', {
        templateUrl: 'views/add-action.html',
        controller: 'AddActionCtrl',
        controllerAs: 'addAction'
      })
      .when('/new-contact', {
        templateUrl: 'views/new-contact.html',
        controller: 'NewContactCtrl',
        controllerAs: 'newContact',
        requireLogin: true
      })
      .when('/profile', {
        templateUrl: 'views/profile.html',
        controller: 'ProfileCtrl',
        controllerAs: 'profile'
      })
      .when('/leftnav', {
        templateUrl: 'views/leftnav.html',
        controller: 'LeftnavCtrl',
        controllerAs: 'leftnav'
      })
      .when('/system-action', {
        templateUrl: 'views/system-action.html',
        controller: 'SystemActionCtrl',
        controllerAs: 'systemAction',
        requireLogin: true
      })
      .when('/sysaction-list', {
        templateUrl: 'views/sysaction-list.html',
        controller: 'SysactionListCtrl',
        controllerAs: 'sysactionList'
      })
      .otherwise({
        redirectTo: '/'
      });
  }]).run(   ['$rootScope', '$location', '$injector', '$log', 'userService', 'Parse',
     function($rootScope ,  $location ,  $injector , $log  , userService , Parse) {

      $rootScope.storedRoute = {returnToNext:{}, returnToUrl:''};

      // gets called whenever route changes
      $rootScope.$on('$routeChangeStart', function(event, next, current) {



        // handle plain redirects, which doesn't require remembering initial route
        if (next && next.dependencyRedirect) {
          var dest = next.dependencyRedirect($injector);
          if (dest) {
            $location.path(dest);
            return;
          }
        }

        // if requires login, remember route and take to login page
        if (next && next.requireLogin && !userService.isLoggedIn() ) {

          $rootScope.storedRoute.returnToNext = next;
          $rootScope.storedRoute.returnToUrl = $location.url();
          $location.path('/login');
          return;
        }
        // after successful login, if remember route exists, take to remembered route
        else if (current && next &&
                 next.originalPath !== current.originalPath &&
                 userService.isLoggedIn() ) {

          // if remember route exists
          if ( $rootScope.storedRoute.returnToUrl.length ) {
            var redirectTo = $rootScope.storedRoute.returnToUrl;
            $rootScope.storedRoute.returnToNext = {};
            $rootScope.storedRoute.returnToUrl = '';
            $location.path(redirectTo);
            return;
          }
        }

      });
    }
  ]);

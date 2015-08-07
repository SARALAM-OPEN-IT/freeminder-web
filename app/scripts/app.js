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
        controllerAs: 'customerList'
      })
      .when('/edit-contact', {
        templateUrl: 'views/edit-contact.html',
        controller: 'EditContactCtrl',
        controllerAs: 'editContact'
      })
      .when('/import-file', {
        templateUrl: 'views/import-file.html',
        controller: 'ImportFileCtrl',
        controllerAs: 'importFile'
      })
      .when('/add-action', {
        templateUrl: 'views/add-action.html',
        controller: 'AddActionCtrl',
        controllerAs: 'addAction'
      })
      .when('/new-contact', {
        templateUrl: 'views/new-contact.html',
        controller: 'NewContactCtrl',
        controllerAs: 'newContact'
      })
      .otherwise({
        redirectTo: '/'
      });
  }]);

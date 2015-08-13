'use strict';

/**
 * @ngdoc function
 * @name freeminderApp.controller:SystemActionCtrl
 * @description
 * # SystemActionCtrl
 * Controller of the freeminderApp
 */
angular.module('freeminderApp')
  .controller('SystemActionCtrl', ['$scope', '$window', '$location', '$log', 'userService', 'Facebook', 'configuration',
    function($scope, $window, $location, $log, userService, Facebook, Config) {
 
         
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
        
    $scope.periods = [
        
        
      {id:0, name:'Select frequency'},
      {id:1, name:'monthly'},
      {id:2, name:'weekly'},
      {id:3, name:'daily'},
      {id:4, name:'annual'},
      {id:5, name:'semi-annual'},
      {id:6, name:'quarterly'},
      {id:7, name:'bi-monthly'},
      {id:8, name:'bi-weekly'},
      {id:9, name:'onetime'},
        
     
    ];
    
        
    $scope.doms = [
    
      {id:0, name:'Select Run Day of month'},
      {id:1, name:'1'},
      {id:2, name:'2'},
      {id:3, name:'3'},
      {id:4, name:'4'},
      {id:5, name:'5'},
      {id:6, name:'6'},
      {id:7, name:'7'},
      {id:8, name:'8'},
      {id:9, name:'9'},
      {id:10, name:'10'},
      {id:11, name:'11'},
      {id:12, name:'12'},
      {id:13, name:'13'},
      {id:14, name:'14'},
      {id:15, name:'15'},
      {id:16, name:'16'},
      {id:17, name:'17'},
      {id:18, name:'18'},
      {id:19, name:'19'},
      {id:20, name:'20'},
      {id:21, name:'21'},
      {id:22, name:'22'},
      {id:23, name:'23'},
      {id:24, name:'24'},
      {id:25, name:'25'},
      {id:26, name:'26'},
      {id:27, name:'27'},
      {id:28, name:'28'},
      {id:29, name:'29'},
      {id:30, name:'30'},
      {id:31, name:'31'},
    
     
    ];
       
        
          
    $scope.actions = [];
    $scope.actionCount = 0;
    
    var user = userService.getUser();
    $scope.rootUser = user;
        
        
    if(!user) {
        $location.path("/login");
        
    }
    
    
    $scope.service = $scope.service_list[0];
    $scope.frequency = $scope.periods[0];
    
  
  

    $scope.add = function () {
          $scope.actionCount++;
          var action  = {};
          action.id = $scope.actionCount;
          action.dom = $scope.doms[0];
          action.service = $scope.service_list[0];
          action.frequency = $scope.periods[0];
          action.start = new Date();
        
          $scope.actions.push(action);
          
    };
        
        
    $scope.remove = function (actionId) {
     
            console.log('Removing action' + actionId); 
            
            $scope.actions.forEach(function(action) {
             
                if(action.id == actionId) {
                    $scope.actions.pop(action);
                    
                }
                
            });
      
    };
        
    $scope.submitForm = function() {
        
        if(!$scope.rootUser.oID.length) {
            $location.path("/login");
        
        }
      //clear the error message first
      $scope.errMsg = '';
      $scope.lMessage = '';
      //get captcha response
      var captchaValue = '';
      $log.debug('Before Save '  );
        
      $scope.lPromise = userService.saveSysAction($scope.objectId, $scope.rootUser.oID, $scope.actions);
        
      $scope.lPromise.then(function(u) {
        //success callback
        $log.debug('After save ' + JSON.stringify(u));
       
        $location.path('/customer-list');
      }, function(r) {
          //error callback
        $log.debug('add action failed ' + JSON.stringify(r));
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
    
    
    }]);
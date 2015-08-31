'use strict';

/**
 * @ngdoc function
 * @name freeminderApp.controller:EditContactCtrl
 * @description
 * # EditContactCtrl
 * Controller of the freeminderApp
 */
angular.module('freeminderApp')
  .controller('EditContactCtrl',  ['$scope', '$window', '$location', '$log', 'userService', 'Facebook', 'configuration',
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
    $scope.selectedContact = userService.getSelectedContact();

    if($scope.selectedContact) {
        console.log($scope.selectedContact.email + ' is selected for edit');

        $scope.name = $scope.selectedContact.name;
        $scope.email = $scope.selectedContact.email;
        $scope.mobile = $scope.selectedContact.mobile;
        $scope.service_list.forEach(function(service) {
            if(service.name ==    $scope.selectedContact.service) {
                $scope.service = $scope.service_list[service.id];
            }
        });

        $scope.objectId = $scope.selectedContact.objectId;
        //any actions

        $scope.lPromise = userService.getActions($scope.selectedContact.objectId);
        $scope.lPromise.then(function(result) {
        //success callback
            $log.debug('After save ' + JSON.stringify(result));

            result.actions.forEach(function(actionr) {
                console.log("action details .." + actionr.actionfrequency)
                var action  = {};

                action.id = $scope.actionCount++;
                action.objectId = actionr.objectId;
                action.action_email = (actionr.email == 'true' ) ? true : false;
                action.action_sms = (actionr.sms == 'true' ) ? true : false;
                action.action_voice = (actionr.voice == 'true' ) ? true : false;
                action.action_name = actionr.actionname;
                action.action_text = actionr.content;

                $scope.doms.forEach(function(dom) {
                    if(dom.name ==   actionr.dom) {

                        action.dom = $scope.doms[dom.id];
                    }
                });

                $scope.service_list.forEach(function(service) {
                    if(service.name ==    actionr.service) {
                        action.service = $scope.service_list[service.id];
                    }
                });

                $scope.periods.forEach(function(period) {
                    if(period.name ==    actionr.actionfrequency) {
                        action.frequency = $scope.periods[period.id];
                    }
                });



                action.start = actionr.actionsince;
                action.end = actionr.actionuntil;
                $scope.actions.push(action);

            });


      }, function(r) {
          //error callback
        $log.debug('unable to fetch actions ' + JSON.stringify(r));
        $scope.errMsg = r.msg;
        //on failure reset the captcha widget as it can't be re-used

      }, function(s) {
        $scope.lMessage = s;
      }).finally(function() {


      });




        //$scope.$apply;

    }



    $scope.add = function () {
          $scope.actionCount++;
          var action  = {};
          action.id = $scope.actionCount;
          action.dom = $scope.doms[0];
          action.service = $scope.service_list[0];
          action.frequency = $scope.periods[0];
          //action.start = new Date();

          $scope.actions.push(action);

    };


    $scope.remove = function (actionr) {

        alert('This action will be removed permanently OK ?');
        console.log('Removing action' + actionr.id);


        $scope.actions.forEach(function(action) {

            if(action.id == actionr.id) {
                $scope.lPromise = userService.removeAction(actionr.objectId);

                $scope.lPromise.then(function(u) {
                    //success callback
                    $log.debug('After save ' + JSON.stringify(u));
                    $scope.actions.pop(actionr);


                }, function(r) {
                    //error callback
                    $log.debug('unable remove action failed ' + JSON.stringify(r));
                    $scope.errMsg = r.msg;


                }, function(s) {
                    $scope.lMessage = s;
                }).finally(function() {


                });



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
      $log.debug('Before Save ' + $scope.email, $scope.mobile, $scope.service.name);

      $scope.lPromise = userService.saveContact($scope.objectId, $scope.rootUser.oID, $scope.email, $scope.mobile, $scope.name, $scope.service.name, $scope.actions);

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

      });


    };



  }]);

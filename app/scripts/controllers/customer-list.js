'use strict';

/**
 * @ngdoc function
 * @name freeminderApp.controller:CustomerListCtrl
 * @description
 * # CustomerListCtrl
 * Controller of the freeminderApp
 */
angular.module('freeminderApp')
  .controller('CustomerListCtrl', ['$scope', 'userService', '$log', '$location', function ($scope, userService, $log, $location) {
    
    $scope.customers = [];
   
    var handleError = function (error) {
    // TODO: Error messaging
    $scope.noGcMsg = "There are currently no customer associated with you. Please try again later.";
    $log.debug("get customer list failed"+ error);
    };

  var handleSuccess = function (data) {
      
    $scope.customers = userService.getCustomers();
    
   /* data.forEach(function(customer) {
    
        $scope.customers.push(customer);
        $log.debug("customer " + customer.email);
        
    });
   */
     

 
 
  };
      
      
  $scope.removeContact = function (contact) {
      alert("Are you sure !!" + contact.email);
      //userService.setSelectedContact(contact);
      //userService.removeContact(contact);
      
      $scope.lPromise = userService.removeContact(contact);
      $scope.lPromise.then(function(u) {
        //success callback
        $log.debug('Removed  ' + JSON.stringify(u));
          
        $scope.customers.forEach(function(customer) {
          
          if(customer.objectId == contact.objectId) {
              $scope.customers.pop(customer);
              $scope.apply;
          }
          
        });

       
      }, function(r) {
          //error callback
        $log.debug('Unable to remove contact ' + JSON.stringify(r));
        $scope.errMsg = r.msg;
        //on failure reset the captcha widget as it can't be re-used
       
      }, function(s) {
        $scope.lMessage = s;
      }).finally(function() {
        //google recaptcha causes input element
        //in IE not to display any updated text.
        //setting focus() seems to fix this issue
       
      });
      

      
  }
  
  
  $scope.editContact = function(contact) {
      
      userService.setSelectedContact(contact);
      
      $location.path('/edit-contact');
  }

  userService.getCustomerList(handleSuccess, handleError);
      
  $scope.go = function (path) {
    $location.path( path );
  }

  $scope.filterCardsBySearch = function(){
    $scope.filterCards();
    var query = $scope.query;
    var filteredmerchantCardsList = [];
    if ( query && query !== '' ) {
      $.each($scope.filteredCards, function (i, item) {
        var storeName = item.merchantName.toLowerCase();
        if (storeName.indexOf(query.toLowerCase()) === 0) {
          filteredmerchantCardsList.push(item);
        }
      });

      $scope.filteredCards = filteredmerchantCardsList;
      $scope.searchResults = filteredmerchantCardsList.length; 
    }
  };
  


 
      
  $scope.importCSV = function (file) {
    console.log("File uploaded");   
  }

    

  }]);

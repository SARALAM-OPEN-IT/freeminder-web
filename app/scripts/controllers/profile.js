'use strict';

/**
 * @ngdoc function
 * @name freeminderApp.controller:ProfileCtrl
 * @description
 * # ProfileCtrl
 * Controller of the freeminderApp
 */
angular.module('freeminderApp')
  .controller('ProfileCtrl', ['$scope', '$log', '$location', '$timeout', '$q', 'configuration', 'userService', 'Profile',
    function ($scope, $log, $location, $timeout, $q, config, userService, Profile) {

      // populate data required for rendering
      $scope.page = 'profile';
      $scope.states = config.states;
      $scope.pInfo = {};
      $scope.uploadProgress = 0;
      $scope.successMessage = '';
      $scope.errorMessage = '';
      $scope.formValidationError = false;
      $scope.fuErrorMessage = '';

      var user = userService.getUser();
      $scope.showPassSection = !user.isFBUser;

      // handler to enable change password section
      $scope.showCPSection = false;
      $scope.ShowCPSection = function() {
        $scope.showCPSection = true;
      };

      // success handler get profile
      var _getProfileSuccess = function(prInfo) {
        $scope.image = prInfo.image || '';
        $scope.pInfo = prInfo;
        $scope.name = prInfo.firstName || prInfo.lastName;
        $scope.pInfo.state = $scope.pInfo.state || $scope.states[0].id;
        $scope.pInfo.image = $scope.pInfo.image || '';
      };

      // failure handler for get profile
      // currently redirecting to login page
      var _getProfileError = function() {
        $log.debug('/users/me failed redirecting to login');
        $location.path('/login');
      };

      // fetch profile info
      Profile.getProfileInfo().then(_getProfileSuccess, _getProfileError);

      $scope.formInvalid = function() {

        // inline validation failures, error message is set inline
        if ($scope.profileForm.$invalid || $scope.profileForm.$pending) {
          $scope.errorMessage = '';
          return true;
        }

        var newpassword = $scope.profileForm.newpassword.$viewValue,
            newpassword2 = $scope.profileForm.newpassword2.$viewValue,
            curpassword = $scope.profileForm.password.$viewValue;

        // only new password is entered case
        if (newpassword && !curpassword) {
          $scope.errorMessage = 'Your current password is not correct.';
          $scope.formValidationError = true;
          return true;
        }

        // only current password is entered case
        if(curpassword && !newpassword) {
          $scope.errorMessage = 'Your new password is not correct.';
          $scope.formValidationError = true;
          return true;
        }

        // new password and confirmation is not matching case
        if (newpassword !== newpassword2) {
          // error message is shown inline to newpassword2 field
          $scope.errorMessage = '';
          return true;
        }

        // new password is same as current password case
        if (curpassword && (newpassword === curpassword)) {
          $scope.errorMessage = 'New password shouldn\'t be same as current password.';
          $scope.formValidationError = true;
          return true;
        }

        $scope.errorMessage = ($scope.formValidationError) ? '' : $scope.errorMessage ;
        $scope.formValidationError = false;
        return false;
      };

      // look for image upload and update parse
      $scope.$watch('pInfo.image', function(newval) {

        // page load case
        if(newval === undefined) {
          return;
        }

        $log.debug(newval + ' ' + $scope.pInfo.image);

        // profile info is fetched with image
        if($scope.image === $scope.pInfo.image) {
          return;
        }

        // Profile image update error, show generic error message
        var _profileImageUpdateFailure = function(result) {
          $scope.errorMessage = 'Unable to process your request';
          $log.debug('Profile Image Update failed');
          $log.debug(result);
        };

        // Profile image update success, update user service
        var _profileImageUpdateSuccess = function() {
          $scope.image = $scope.pInfo.image;
          Profile.getCompleteProfile().then(function(profileData) {
            if(profileData) {
              profileData.image = $scope.pInfo.image;
              userService.updateUserInfo(profileData);
            }
          });
        };

        // new image is uploaded, update profile
        $scope.lPromise = Profile.updateProfileImage($scope.pInfo.userId, $scope.pInfo.image, $scope.image);
        $scope.lPromise.then(_profileImageUpdateSuccess,
                             _profileImageUpdateFailure,
                             function(s) {$scope.lMessage = s;});
      });

      var _updateProfileData = function() {

        var deferred = $q.defer();
        var updateProfileInfoResult = {};

        // success handler
        // Update user service with new changes, for change password, update sessiontoken
        // For mobile update case, take user to verify-mobile page
        // For other updates, show confirmation and keep in him profile page
        var _finalUpdateSuccess = function(cpResult, profileResult) {
          deferred.resolve('success');

          // clear password fields and hide password section
          $scope.newpassword = '';
          $scope.newpassword2 = '';
          $scope.password = '';
          $scope.showCPSection = false;

          // update userService with profile changes
          // For password change, update user service with new session token too.
          var sessionToken = (cpResult && cpResult.result) ? (cpResult.result.session || '') : '';
          Profile.getCompleteProfile().then(function(profileData){
            $log.debug(profileData);
            if(profileData) {
              profileData.session = sessionToken;
              profileData.mobileVerified = (profileResult && profileResult.code === 11) ? false : profileData.mobileVerified;
              userService.updateUserInfo(profileData);
            }
          });

          $log.debug(profileResult);

          // Redirect the user to verify-mobile page for mobile number change
          if(profileResult && profileResult.code === 11) {
            $log.debug('redirecting to verify-mobile');
            $location.path('/verify-mobile');
            return;
          }

          // Show status success message
          $scope.successMessage = 'User details have been saved successfully.';
        };

        // Change password failures, show password error
        var _changePasswordFailure = function(result) {
          var error = userService.parseErrorResponse(result.data || result);
          deferred.reject('failure');
          $scope.errorMessage = (error.msg === 'username/password not correct') ?
            'Your current password is not correct. Please try again.' : 'Unable to process your request.';
          $log.debug(error.msg);
        };

        // Profile update error, show generic error message
        var _profileUpdateFailure = function(result) {
          deferred.reject('failure');
          $log.debug('Profile Update failed');
          var error = userService.parseErrorResponse(result.data || result);
          if(error.swCode === 603) {
            $scope.errorMessage = 'Invalid mobile number. Please try again.';
          }
          $scope.errorMessage = $scope.errorMessage || 'Unable to process your request';
        };

        $timeout(function() {
          deferred.notify('Updating profile data');
        }, 0);


        // chain updates in profile page
        // change password should be done last, since it invalidates session token
        // no rollback of previous steps if any of the udpates fail
        Profile.updateProfileInfo($scope.pInfo).then(function(result) {
          updateProfileInfoResult = result || {};
          //deferred.notify('Updating password');
          return Profile.changePassword($scope.pInfo.email, $scope.password, $scope.newpassword);
        }, _profileUpdateFailure).then(function(cpResult) {
          _finalUpdateSuccess(cpResult, updateProfileInfoResult.result);
        }, _changePasswordFailure).catch(function(error) {
          _profileUpdateFailure(error);
        });

        return deferred.promise;

      };

      // handle form submission
      $scope.submitForm = function() {

        $scope.errorMessage = $scope.successMessage = '';

        if ($scope.newpassword !== $scope.newpassword2) {
          $scope.errorMessage = 'Passwords didn\'t match';
          $scope.newpassword = '';
          $scope.newpassword2 = '';
          return false;
        }

        if ($scope.newpassword && !$scope.password) {
          $scope.errorMessage = 'Your current password is not correct. Please try again.';
          return false;
        }

        $scope.lPromise = _updateProfileData();
        $scope.lPromise.then(function() {
          $log.debug('Profile update successful');
        }, function() {
          $log.debug('Profile update failed');
        }, function(s) {
          $log.debug('On progress ' + s);
          $scope.lMessage = s;
        });

      };

  }]);


'use strict';

describe('Controller: ForgotpasswordCtrl', function () {

  // load the controller's module
  beforeEach(module('swappableWebApp'));

  var ForgotpasswordCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ForgotpasswordCtrl = $controller('ForgotpasswordCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});

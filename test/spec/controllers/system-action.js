'use strict';

describe('Controller: SystemActionCtrl', function () {

  // load the controller's module
  beforeEach(module('freeminderApp'));

  var SystemActionCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    SystemActionCtrl = $controller('SystemActionCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(SystemActionCtrl.awesomeThings.length).toBe(3);
  });
});

'use strict';

describe('Controller: LeftnavCtrl', function () {

  // load the controller's module
  beforeEach(module('freeminderApp'));

  var LeftnavCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    LeftnavCtrl = $controller('LeftnavCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(LeftnavCtrl.awesomeThings.length).toBe(3);
  });
});

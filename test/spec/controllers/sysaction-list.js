'use strict';

describe('Controller: SysactionListCtrl', function () {

  // load the controller's module
  beforeEach(module('freeminderApp'));

  var SysactionListCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    SysactionListCtrl = $controller('SysactionListCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(SysactionListCtrl.awesomeThings.length).toBe(3);
  });
});

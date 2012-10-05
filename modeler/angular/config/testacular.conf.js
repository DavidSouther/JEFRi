basePath = '../';

files = [
  JASMINE,
  JASMINE_ADAPTER,

  'app/lib/$/jquery-latest.js',
  'app/lib/_/underscore.js',
  'app/lib/_/superscore.js',
  'app/lib/jefri/jefri.js',
  'app/lib/angular/angular.js',
  'app/lib/angular/angular-*.js',
  'test/lib/angular/angular-mocks.js',

  'app/dist/modeler.js',
  'test/unit.js'
];

autoWatch = true;

browsers = ['Chrome', 'Firefox'];

junitReporter = {
  outputFile: 'test_out/unit.xml',
  suite: 'unit'
};

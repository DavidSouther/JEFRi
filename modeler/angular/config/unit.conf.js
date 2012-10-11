basePath = '../';

files = [
  JASMINE,
  JASMINE_ADAPTER,

  'app/scripts/lib/$/min.js',
  'app/scripts/lib/$/ui/min.js',
  'app/scripts/lib/_/dev.js',
  'app/scripts/lib/_/superscore.js',
  'app/scripts/lib/jefri/min.js',
  'app/scripts/lib/angular/min.js',
  'app/scripts/lib/angular/ui/min.js',

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

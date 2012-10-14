basePath = '../';

files = [
  JASMINE,
  JASMINE_ADAPTER,

  'build/scripts/lib/$/min.js',
  'build/scripts/lib/$/ui/min.js',
  'build/scripts/lib/_/dev.js',
  'build/scripts/lib/_/superscore.js',
  'build/scripts/lib/jefri/min.js',
  'build/scripts/lib/angular/min.js',
  'build/scripts/lib/angular/ui/min.js',

  'test/lib/angular/angular-mocks.js',

  'build/dist/jefri-modeler.js',
  'test/unit.js'
];

autoWatch = true;

browsers = ['Chrome', 'Firefox'];

junitReporter = {
  outputFile: 'test_out/unit.xml',
  suite: 'unit'
};

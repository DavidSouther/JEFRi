basePath = '../';

urlRoot = '/_testacular';

files = [
  ANGULAR_SCENARIO,
  ANGULAR_SCENARIO_ADAPTER,
  'test/e2e.js'
];

autoWatch = true;

//browsers = ['Chrome', 'Firefox'];
browsers = ['Chrome'];

proxies = {
  '/': 'http://model.localhost/'
};


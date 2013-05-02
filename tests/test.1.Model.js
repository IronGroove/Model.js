module("Model class attributes");

test("_classes", function () {
  deepEqual( Model._classes, {} );
});

test("_classEventNames", function () {
  var names = "initialize change persist revert";
  deepEqual( Model._eventNames, names.split(' '), names);
});

test("_validators", function () {
  ok( $.isPlainObject(Model._validators),       'Model._validators attribute exists and is plain object' );
  ok( $.isFunction(Model._validators.string),   'Model._validators.string'   );
  ok( $.isFunction(Model._validators.number),   'Model._validators.number'   );
  ok( $.isFunction(Model._validators.boolean),  'Model._validators.boolean'  );
  ok( $.isFunction(Model._validators.nonnull),  'Model._validators.nonnull'  );
  ok( $.isFunction(Model._validators.nonempty), 'Model._validators.nonempty' );
  ok( $.isFunction(Model._validators.in),       'Model._validators.in'       );
  ok( objectSize(Model._validators) == 6,       'and nothing else'           );
});

test("errCodes", function () {
  ok( $.isPlainObject(Model.errCodes),          'Model.errCodes attribute exists and is plain object' );
  ok( Model.errCodes.WRONG_TYPE == 'wrongtype', 'Model.errCodes.WRONG_TYPE'  );
  ok( Model.errCodes.NULL == 'null',            'Model.errCodes.NULL'        );
  ok( Model.errCodes.EMPTY == 'empty',          'Model.errCodes.EMPTY'       );
  ok( Model.errCodes.NOT_IN == 'notin',         'Model.errCodes.NOT_IN'      );
  ok( objectSize(Model.errCodes) == 4,          'and nothing else'           );
});





module("Model class attributes # _validators");

test("string", function () {
  var validator = Model._validators.string;
  ok( validator('123') === undefined,                 'should return no errCode having received a string argument' );
  ok( validator(12345) === Model.errCodes.WRONG_TYPE, 'string validator returns WRONG_TYPE errCode having received a non-string argument' );
  // TODO Expand on a non-string argument.
});

test("number", function () {
  var validator = Model._validators.number;
  ok( validator(123) === undefined,                   'should return no errCode having received an integer number argument' );
  ok( validator(1.2) === undefined,                   'should return no errCode having received a float number argument' );
  ok( validator('1') === Model.errCodes.WRONG_TYPE,   'should return WRONG_TYPE errCode having received a non-number argument' );
  // TODO Expand on a non-number argument.
});

test("boolean", function () {
  var validator = Model._validators.boolean;
  ok( validator(true)  === undefined,                 'should return no errCode having received boolean true argument' );
  ok( validator(false) === undefined,                 'should return no errCode having received boolean false argument' );
  ok( validator(1234)  === Model.errCodes.WRONG_TYPE, 'should return WRONG_TYPE errCode having received a number' );
  ok( validator(null)  === Model.errCodes.WRONG_TYPE, 'should return WRONG_TYPE errCode having received null' );
  ok( validator('str') === Model.errCodes.WRONG_TYPE, 'should return WRONG_TYPE errCode having received a string' );
  // TODO Write tests for other types as well.
});

test("nonnull", function () {
  var validator = Model._validators.nonnull;
  ok( validator(0)    === undefined,                  'should return no errCode having received nonnull argument' );
  ok( validator(null) === Model.errCodes.NULL,        'should return NULL errCode having received null argument' );
  // TODO Write tests for other types as well.
});

test("nonempty", function () {
  var validator = Model._validators.nonempty;
  ok( validator('')    === Model.errCodes.EMPTY,      'should return EMPTY errCode having received an empty string argument' );
  ok( validator('abc') === undefined,                 'should return no errCode having received a non-empty string argument' );
  // TODO Write tests for other types as well.
});

test("in", function () {
  var validator = Model._validators.in;
  ok( validator(123, [12, 34]) === Model.errCodes.NOT_IN, 'should return NOT_IN errCode having received an empty string argument' );
  ok( validator(123, [123, 34]) === undefined,            'should return undefined having received a value that is also present in a 2nd arg array' );
});




module("Model class methods # registerValidator", {
  setup: function () {
    this._initialModelValidators = $.extend({}, Model._validators);
  },
  teardown: function () {
    Model._validators = $.extend({}, this._initialModelValidators);
  }
});

test("fails unless 1st argument is [a-zA-Z]+ string", function () {
  throws(function(){ Model.registerValidator(); },          /M101/, 'not specified');
  throws(function(){ Model.registerValidator(null); },      /M101/, 'null');
  throws(function(){ Model.registerValidator(undefined); }, /M101/, 'undefined');
  throws(function(){ Model.registerValidator(1234); },      /M101/, 'number');
  throws(function(){ Model.registerValidator(true); },      /M101/, 'boolean true');
  throws(function(){ Model.registerValidator(false); },     /M101/, 'boolean false');
  throws(function(){ Model.registerValidator($.noop); },    /M101/, 'function');
  throws(function(){ Model.registerValidator([]); },        /M101/, 'array');
  throws(function(){ Model.registerValidator({}); },        /M101/, 'object');
  throws(function(){ Model.registerValidator(/string/); },  /M101/, 'regexp');
  throws(function(){ Model.registerValidator('str1ng'); },  /M101/, 'contains numbers (wrong format)');
});

test("fails unless 2nd argument is function", function () {
  throws(function(){ Model.registerValidator('string'); },            /M101/, 'not specified');
  throws(function(){ Model.registerValidator('string', null); },      /M101/, 'null');
  throws(function(){ Model.registerValidator('string', undefined); }, /M101/, 'undefined');
  throws(function(){ Model.registerValidator('string', 1234); },      /M101/, 'number');
  throws(function(){ Model.registerValidator('string', 'string'); },  /M101/, 'string');
  throws(function(){ Model.registerValidator('string', true); },      /M101/, 'boolean true');
  throws(function(){ Model.registerValidator('string', false); },     /M101/, 'boolean false');
  throws(function(){ Model.registerValidator('string', []); },        /M101/, 'array');
  throws(function(){ Model.registerValidator('string', {}); },        /M101/, 'object');
  throws(function(){ Model.registerValidator('string', /re/); },      /M101/, 'regexp');

  Model.registerValidator('some', $.noop);
  ok(true, 'passes if 1st argument is string 2nd argument is function');
});

test("fails if validator with that name already exists", function () {
  Model.registerValidator('some', $.noop);
  throws(function () { Model.registerValidator('some', $.noop); }, /M101/);
});

test("should populate Model._validators object with a new key-value pair", function () {
  Model.registerValidator('some', $.noop);
  ok(Model._validators['some'] === $.noop);
});

test("next calls should not affect previously registered valildators", function () {
  var noop1 = function () {},
    noop2 = function () {},
    noop3 = function () {};

  Model.registerValidator('some', noop1);
  ok(Model._validators['some'] === noop1);

  Model.registerValidator('next', noop2);
  ok(Model._validators['next'] === noop2);
  ok(Model._validators['some'] === noop1);

  Model.registerValidator('other', noop3);
  ok(Model._validators['other'] === noop3);
  ok(Model._validators['next'] === noop2);
  ok(Model._validators['some'] === noop1);
});





module("Model instance, e.g. Class, creation", {
  teardown: function () {
    Model._classes = {};
  }
});

test("should fail without keyword `new`", function () {
  throws(function () { var Note = Model(); }, /M001/ );
});

test("should fail if Class name (1st argument) is not a string or "+
     "Class configuration (2nd argument) is not a function",
function () {

  throws(function(){ var N = new Model(); },              /M002/, '1: not specified');
  throws(function(){ var N = new Model(undefined);},      /M002/, '1: explicit undefined');
  throws(function(){ var N = new Model(null); },          /M002/, '1: null');
  throws(function(){ var N = new Model(true); },          /M002/, '1: boolean true');
  throws(function(){ var N = new Model(false); },         /M002/, '1: boolean false');
  throws(function(){ var N = new Model(1234); },          /M002/, '1: number');
  throws(function(){ var N = new Model($.noop); },        /M002/, '1: function');
  throws(function(){ var N = new Model(/re/); },          /M002/, '1: regexp');
  throws(function(){ var N = new Model([]); },            /M002/, '1: array');
  throws(function(){ var N = new Model({}); },            /M002/, '1: plain object');

  throws(function(){ var N = new Model('N'); },           /M002/, '2: not specified');
  throws(function(){ var N = new Model('N', undefined);}, /M002/, '2: explicit undefined');
  throws(function(){ var N = new Model('N', null); },     /M002/, '2: null');
  throws(function(){ var N = new Model('N', true); },     /M002/, '2: boolean true');
  throws(function(){ var N = new Model('N', false); },    /M002/, '2: boolean false');
  throws(function(){ var N = new Model('N', 1234); },     /M002/, '2: number');
  throws(function(){ var N = new Model('N', 'string'); }, /M002/, '2: string');
  throws(function(){ var N = new Model('N', /re/); },     /M002/, '2: regexp');
  throws(function(){ var N = new Model('N', []); },       /M002/, '2: array');

  var Note = new Model('Note', $.noop);
  ok(true, "passes if 1st argument is a string and 2nd is a function");
});

test("should fail if Class with specified name already exists", function () {
  throws( function () {
    var Note = new Model('Note', $.noop);
    Note = new Model('Note', $.noop);
  },
  /M003/ );
});


test("new Classes should know their names and Model should remembers created Classes by their names", function () {
  var Note = new Model('Note', $.noop),
    Post = new Model('Post', $.noop);

  ok( Note.className == 'Note');
  ok( Post.className == 'Post');
  ok( objectSize(Model._classes) == 2 );
  ok( Model._classes.Note == Note );
  ok( Model._classes.Post == Post );
});





module("Class sanity checks");

// TODO

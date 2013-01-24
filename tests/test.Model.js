module("Model class attributes");

test("_classes", function () {
  ok( $.isPlainObject(Model._classes) );
});

test("_classEventNames", function () {
  var names = "initialize change";
  deepEqual( Model._classEventNames, names.split(' '), names);
});

test("_instanceEventNames", function () {
  var names = "change persist";
  deepEqual( Model._instanceEventNames, names.split(' '), names);
});

test("_validators", function () {
  ok( $.isPlainObject(Model._validators),       'Model._validators attribute exists and is plain object' );
  ok( $.isFunction(Model._validators.string),   'Model._validators.string'   );
  ok( $.isFunction(Model._validators.number),   'Model._validators.number'   );
  ok( $.isFunction(Model._validators.boolean),  'Model._validators.boolean'  );
  ok( $.isFunction(Model._validators.nonnull),  'Model._validators.nonnull'  );
  ok( $.isFunction(Model._validators.nonempty), 'Model._validators.nonempty' );
});

test("errCodes", function () {
  ok( $.isPlainObject(Model.errCodes), 'Model.errCodes attribute exists and is plain object' );
  ok( Model.errCodes.WRONG_TYPE,       'Model.errCodes.WRONG_TYPE' );
  ok( Model.errCodes.NULL,             'Model.errCodes.NULL'       );
  ok( Model.errCodes.EMPTY,            'Model.errCodes.EMPTY'      );
});





module("Model class attributes: _validators");

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





module("Model class methods: registerValidator", {
  setup: function () {
    this._initialModelValidators = $.extend({}, Model._validators);
  },
  teardown: function () {
    Model._validators = $.extend({}, this._initialModelValidators);
  }
});

test("fails unless 1st argument is [a-zA-Z]+ string", function () {
  throws(function(){ Model.registerValidator(); },         /M101/, 'fails if 1st argument is not specified');
  throws(function(){ Model.registerValidator(null); },     /M101/, 'fails if 1st argument is null');
  throws(function(){ Model.registerValidator(1234); },     /M101/, 'fails if 1st argument is number');
  throws(function(){ Model.registerValidator(true); },     /M101/, 'fails if 1st argument is boolean true');
  throws(function(){ Model.registerValidator(false); },    /M101/, 'fails if 1st argument is boolean false');
  throws(function(){ Model.registerValidator($.noop); },   /M101/, 'fails if 1st argument is function');
  throws(function(){ Model.registerValidator([]); },       /M101/, 'fails if 1st argument is array');
  throws(function(){ Model.registerValidator({}); },       /M101/, 'fails if 1st argument is object');
  throws(function(){ Model.registerValidator(/string/); }, /M101/, 'fails if 1st argument is regexp');
  throws(function(){ Model.registerValidator('str1ng'); }, /M101/, 'fails if 1st argument contains numbers');
});

test("fails unless 2nd argument is function", function () {
  throws(function(){ Model.registerValidator('string'); },           /M101/, 'fails if 2nd argument is not specified');
  throws(function(){ Model.registerValidator('string', null); },     /M101/, 'fails if 2nd argument is null');
  throws(function(){ Model.registerValidator('string', 1234); },     /M101/, 'fails if 2nd argument is number');
  throws(function(){ Model.registerValidator('string', true); },     /M101/, 'fails if 2nd argument is boolean true');
  throws(function(){ Model.registerValidator('string', false); },    /M101/, 'fails if 2nd argument is boolean false');
  throws(function(){ Model.registerValidator('string', []); },       /M101/, 'fails if 2nd argument is array');
  throws(function(){ Model.registerValidator('string', {}); },       /M101/, 'fails if 2nd argument is object');
  throws(function(){ Model.registerValidator('string', /re/); },     /M101/, 'fails if 2nd argument is regexp');
  throws(function(){ Model.registerValidator('string', 'string'); }, /M101/, 'fails if 2nd argument is string');

  Model.registerValidator('some', $.noop);
  ok(true, 'passes if 2nd argument is function');
});

test("fails if validator with that name already exists", function () {
  Model.registerValidator('some', $.noop);
  throws(function () { Model.registerValidator('some', $.noop); }, /M101/);
});

test("should populate Model._validators object with a new key-value pair", function () {
  Model.registerValidator('some', $.noop);
  ok(Model._validators['some'] === $.noop);
});

test("next calls next calls should not affect previously registered valildators", function () {
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





module("Model class methods: _parseAttributeNotation");

test("should return false unless provided notation is a string", function () {
  ok( ! Model._parseAttributeNotation(),          'not specified');
  ok( ! Model._parseAttributeNotation(undefined), 'explicit undefined');
  ok( ! Model._parseAttributeNotation(null),      'null');
  ok( ! Model._parseAttributeNotation(1234),      'number');
  ok( ! Model._parseAttributeNotation(true),      'boolean true');
  ok( ! Model._parseAttributeNotation(false),     'boolean false');
  ok( ! Model._parseAttributeNotation([]),        'array');
  ok( ! Model._parseAttributeNotation({}),        'object');
  ok( ! Model._parseAttributeNotation(/re/),      'regexp');
  ok( ! Model._parseAttributeNotation($.noop),    'function');
});

test("should return false if provided notation is invalid", function () {
  ok( ! Model._parseAttributeNotation('id number'),     "invalid if first token—attribute name—is NOT within brackets");
  ok( ! Model._parseAttributeNotation('[1d] number'),   "invalid if attribute name is not a-Z string");
  ok( ! Model._parseAttributeNotation('[slug] str1ng'), "invalid if there is a non a-Z char in following after brackets validator names");
  ok( ! Model._parseAttributeNotation('[] number'),     "invalid if there is no attribute name between the brackets");
  ok( ! Model._parseAttributeNotation('[]'),            "invalid if there is no attribute name between the brackets and no validator names after them");
});

test("should return result if provided notation is valid", function () {
  var parsed = {};

  ok( parsed[0] = Model._parseAttributeNotation('[aZ] aZstring'),   "valid if first token—attribute name—is a-Z string within brackets, followed by a-Z validator names separated by spaces");
  ok( parsed[1] = Model._parseAttributeNotation('[id]'),            "valid if there's only attribute name");
  ok( parsed[2] = Model._parseAttributeNotation('[id] number nil'), "valid if several validators requested");
  ok( parsed[3] = Model._parseAttributeNotation('[id] nil nil'),    "valid if duplicate validators requested");
  ok( parsed[4] = Model._parseAttributeNotation('[id] number'),     "valid if requested validators are known");
  ok( parsed[5] = Model._parseAttributeNotation('[id] unknown'),    "valid even if requested validators are unknown");

  ok( $.isPlainObject(parsed[0]) );
  ok( objectSize(parsed[0]) == 2 );
  equal( parsed[0].attrName, 'aZ' );
  deepEqual( parsed[0].validators, [ 'aZstring' ] );

  ok( $.isPlainObject(parsed[1]) );
  ok( objectSize(parsed[1]) == 2 );
  equal( parsed[1].attrName, 'id' );
  deepEqual( parsed[1].validators, [] );

  ok( $.isPlainObject(parsed[2]) );
  ok( objectSize(parsed[2]) == 2 );
  equal( parsed[2].attrName, 'id' );
  deepEqual( parsed[2].validators, [ 'number', 'nil'] );

  ok( $.isPlainObject(parsed[3]) );
  ok( objectSize(parsed[3]) == 2 );
  equal( parsed[3].attrName, 'id' );
  deepEqual( parsed[3].validators, [ 'nil'] );

  ok( $.isPlainObject(parsed[4]) );
  ok( objectSize(parsed[4]) == 2 );
  equal( parsed[4].attrName, 'id' );
  deepEqual( parsed[4].validators, [ 'number' ] );

  ok( $.isPlainObject(parsed[5]) );
  ok( objectSize(parsed[5]) == 2 );
  equal( parsed[5].attrName, 'id' );
  deepEqual( parsed[5].validators, [ 'unknown' ] );
});

test("trimmed provided notation or not, it should not affect the result", function () {
  ok( Model._parseAttributeNotation(' [id] ')            );
  ok( Model._parseAttributeNotation(' [id] number ')     );
  ok( Model._parseAttributeNotation(' [id] number nil ') );
  ok( ! Model._parseAttributeNotation(' [] ')            );
  ok( ! Model._parseAttributeNotation(' [] string ')     );
  ok( ! Model._parseAttributeNotation(' [1d] string ')   );
  ok( ! Model._parseAttributeNotation(' [id] str1ng ')   );
});





module("Model instance, e.g. Class, creation", {
  teardown: function () {
    Model._classes = {};
  }
});

test("fails without keyword `new`", function () {
  throws(function () { var Note = Model(); }, /M001/ );

  var Note = new Model('Note', $.noop);
  ok(true, "passes if 1st argument is a string and 2nd is a function");
});

test("fails unless Class name (1st argument) is a string", function () {
  throws(function(){ var Note = new Model(); },         /M002/, 'not specified');
  throws(function(){ var Note = new Model(undefined);}, /M002/, 'explicit undefined');
  throws(function(){ var Note = new Model(null); },     /M002/, 'null');
  throws(function(){ var Note = new Model(true); },     /M002/, 'boolean true');
  throws(function(){ var Note = new Model(false); },    /M002/, 'boolean false');
  throws(function(){ var Note = new Model(1234); },     /M002/, 'number');
  throws(function(){ var Note = new Model($.noop); },   /M002/, 'function');
  throws(function(){ var Note = new Model(/re/); },     /M002/, 'regexp');
  throws(function(){ var Note = new Model([]); },       /M002/, 'array');
  throws(function(){ var Note = new Model({}); },       /M002/, 'plain object');
});

test("fails unless Class configuration (2nd argument) is a function", function () {
  throws(function(){ var Note = new Model('Note'); },           /M002/, 'not specified');
  throws(function(){ var Note = new Model('Note', undefined);}, /M002/, 'explicit undefined');
  throws(function(){ var Note = new Model('Note', null); },     /M002/, 'null');
  throws(function(){ var Note = new Model('Note', true); },     /M002/, 'boolean true');
  throws(function(){ var Note = new Model('Note', false); },    /M002/, 'boolean false');
  throws(function(){ var Note = new Model('Note', 1234); },     /M002/, 'number');
  throws(function(){ var Note = new Model('Note', 'string'); }, /M002/, 'string');
  throws(function(){ var Note = new Model('Note', /re/); },     /M002/, 'regexp');
  throws(function(){ var Note = new Model('Note', []); },       /M002/, 'array');
});

test("fails if Class with specified name already exists", function () {
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

// test("fails if any of attributes has error in its attribute notation", function () {
//   throws(function () {
//     var Note = new Model('Note', {
//       attributes: [
//         '[id] number',
//         '[title] string',
//         '1nC00rrect attr1bute n0tat10n'
//       ]
//     });
//   }, /M006/, "incorrect format");
//
//   throws(function () {
//     var Note = new Model('Note', {
//       attributes: [
//         '[id] number',
//         '[title] string',
//         '[description] unexistent'
//       ]
//     });
//   },
//   /M007/, "unknown validator");
// });
//
//
//
// test("Class.attributeNames should contain array of declared instance attribute names", function () {
//   var Note = new Model('Note', function () {
//     this.attr('id', 'number');
//     this.attr('title', 'string');
//   });
//
//   var Post = new Model('Post', function () {
//     this.attr('id', 'number');
//     this.attr('title', 'string');
//     this.attr('body', 'string');
//   });
//
//   deepEqual( Note.attributeNames, [ 'id', 'title' ]);
//   deepEqual( Post.attributeNames, [ 'slug', 'title', 'body' ]);
// });
//
//
// test("Class._attributes should be a map of attrName to validators", function () {
//   var Note = new Model('Note', {
//       attributes: [
//         '[id] nonnull number',
//         '[title] nonnull nonempty string'
//       ]
//     });
//   deepEqual( Note._attributes.id, [ 'nonnull', 'number' ]);
//   deepEqual( Note._attributes.title, [ 'nonnull', 'nonempty', 'string' ]);
// });
//
// test("Class.idAttr is first attribute declared", function () {
//   var Note = new Model('Note', {
//       attributes: [
//         '[id] number',
//         '[title] string'
//       ]
//     }),
//     Post = new Model('Post', {
//       attributes: [
//         '[slug] number',
//         '[title] string',
//         '[body] string'
//       ]
//     });
//   ok( Note.idAttr === 'id');
//   ok( Post.idAttr === 'slug');
// });






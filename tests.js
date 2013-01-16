/*

Model.registerValidator('null', function (value) {
  return true;
});

Model.registerValidator('email', function (value) {
  if (!isValidEmail(value)) return Model.errCodes.INVALID_EMAIL;
});

var Note = new Model('Note', {
  attributes: [
      '[id] nonnull number',
      '[title] nonnull nonempty string',
      '[email] null nonempty string email'  // email is not required
    ]
});

Note(1) // returns an instance if it is initialized
Note(2) // returns undefined if instance hasn't been initialaized

// Few examples on instances which need to be created with ids known in advance.
new Note({…})                  // not persisted:  isNew == true   isChanged == false  isPersisted=false
new Note({ id: 123, …})        // persisted:      isNew == false  isChanged == false  isPersisted=true
new Note(false, { id: 123, …}) // not persisted:  isNew == true   isChanged == false  isPersisted=false

var note = new Note({ title: "Unknown" });
note.isNew     // true
note.isChanged // false
note.data.title = "Abecedario";
note.isChanged // true
note.revert();
note.isChanged // false
note.data.title = "Alphabet";
note.isChanged // true
note._changed  // { title: "Unknown" }
note.isValid   // true, calls note._validate()
note.save();   // should call note._persist() when instance persisted or note._rollback() if shit happened
note.isChanged // false

// Set up event handlers related to all instances of a Model class.
Note.bind('initialize', handler);
Note.bind('beforeValidate', handler);

// Set up event handlers related to a specific instance.
note.bind('change', handler);
note.bind('revert', handler);
note.bind('save', handler);
note.bind('persist', handler);
note.bind('rollback', handler);

*/

function objectSize(obj) {
  var size = 0;
  for (var k in obj) if (obj.hasOwnProperty(k)) size ++;
  return size;
}

function objectKeys(obj) {
  var keys = [];
  for (var k in obj) keys.push(k);
  return keys;
}



test("Model.errCodes should be there", function () {
  ok( Model.errCodes,            'Model.errCodes'            );
  ok( Model.errCodes.WRONG_TYPE, 'Model.errCodes.WRONG_TYPE' );
  ok( Model.errCodes.NULL,       'Model.errCodes.NULL'       );
  ok( Model.errCodes.EMPTY,      'Model.errCodes.EMPTY'      );
});

test("Model.classes should be there", function () {
  ok( $.isPlainObject(Model.classes) );
});

test("Model._validators should be ready", function () {
  ok( Model._validators['string'], 'string validator exists' );
  ok( Model._validators['string']('123') === undefined, 'string validator returns no errCode having received string argument' );
  ok( Model._validators['string'](123) === Model.errCodes.WRONG_TYPE, 'string validator returns WRONG_TYPE errCode having received non-string argument' );

  ok( Model._validators['number'], 'number validator exists' );
  ok( Model._validators['number'](123) === undefined, 'number validator returns no errCode having received number argument' );
  ok( Model._validators['number']('123') === Model.errCodes.WRONG_TYPE, 'number validator returns WRONG_TYPE errCode having received non-number argument' );

  ok( Model._validators['boolean'], 'boolean validator exists' );
  ok( Model._validators['boolean'](true) === undefined, 'boolean validator returns no errCode having received boolean true argument' );
  ok( Model._validators['boolean'](false) === undefined, 'boolean validator returns no errCode having received boolean false argument' );
  ok( Model._validators['boolean'](123) === Model.errCodes.WRONG_TYPE, 'boolean validator returns WRONG_TYPE errCode having received a number' );
  ok( Model._validators['boolean'](null) === Model.errCodes.WRONG_TYPE, 'boolean validator returns WRONG_TYPE errCode having received null' );
  ok( Model._validators['boolean']('str') === Model.errCodes.WRONG_TYPE, 'boolean validator returns WRONG_TYPE errCode having received a string' );

  ok( Model._validators['nonnull'], 'nonnull validator exists' );
  ok( Model._validators['nonnull'](0) === undefined, 'nonnull validator returns no errCode having received nonnull argument' );
  ok( Model._validators['nonnull'](null) === Model.errCodes.NULL, 'nonnull validator returns NULL errCode having received null argument' );

  ok( Model._validators['nonempty'], 'nonempty validator exists' );
  ok( Model._validators['nonempty'](0) === undefined, 'nonempty validator returns no errCode having received non-string argument' );
  ok( Model._validators['nonempty']('abc') === undefined, 'nonempty validator returns no errCode having received non-empty string argument' );
  ok( Model._validators['nonempty']('') === Model.errCodes.EMPTY, 'nonempty validator returns EMPTY errCode having received empty string argument' );
});



module("Model.registerValidator", {
  setup: function () {
    this._initialModelValidators = $.extend({}, Model._validators);
  },
  teardown: function () {
    Model._validators = $.extend({}, this._initialModelValidators);
  }
});

test("fails unless 1st argument is [a-zA-Z]+ string", function () {
  throws(function () { Model.registerValidator(); },         /MrV01/, 'fails if 1st argument is not specified');
  throws(function () { Model.registerValidator(null); },     /MrV01/, 'fails if 1st argument is null');
  throws(function () { Model.registerValidator(1234); },     /MrV01/, 'fails if 1st argument is number');
  throws(function () { Model.registerValidator(true); },     /MrV01/, 'fails if 1st argument is boolean true');
  throws(function () { Model.registerValidator(false); },    /MrV01/, 'fails if 1st argument is boolean false');
  throws(function () { Model.registerValidator($.noop); },   /MrV01/, 'fails if 1st argument is function');
  throws(function () { Model.registerValidator([]); },       /MrV01/, 'fails if 1st argument is array');
  throws(function () { Model.registerValidator({}); },       /MrV01/, 'fails if 1st argument is object');
  throws(function () { Model.registerValidator(/string/); }, /MrV01/, 'fails if 1st argument is regexp');
  throws(function () { Model.registerValidator('str1ng'); }, /MrV01/, 'fails if 1st argument contains numbers');
  throws(function () { Model.registerValidator('string'); }, /MrV02/, 'passes if 1st argument is a correct string');
});

test("fails unless 2nd argument is function", function () {
  throws(function () { Model.registerValidator('string'); },           /MrV02/, 'fails if 2nd argument is not specified');
  throws(function () { Model.registerValidator('string', null); },     /MrV02/, 'fails if 2nd argument is null');
  throws(function () { Model.registerValidator('string', 1234); },     /MrV02/, 'fails if 2nd argument is number');
  throws(function () { Model.registerValidator('string', true); },     /MrV02/, 'fails if 2nd argument is boolean true');
  throws(function () { Model.registerValidator('string', false); },    /MrV02/, 'fails if 2nd argument is boolean false');
  throws(function () { Model.registerValidator('string', []); },       /MrV02/, 'fails if 2nd argument is array');
  throws(function () { Model.registerValidator('string', {}); },       /MrV02/, 'fails if 2nd argument is object');
  throws(function () { Model.registerValidator('string', /re/); },     /MrV02/, 'fails if 2nd argument is regexp');
  throws(function () { Model.registerValidator('string', 'string'); }, /MrV02/, 'fails if 2nd argument is string');

  Model.registerValidator('some', $.noop);
  ok(true, 'passes if 2nd argument is function');
});

test("fails if validator with that name already exists", function () {
  Model.registerValidator('some', $.noop);
  throws(function () { Model.registerValidator('some', $.noop); }, /MrV03/);
});

test("populates Model._validators object with new key-value pair", function () {
  Model.registerValidator('some', $.noop);
  ok(Model._validators['some'] === $.noop);
});

test("next calls do not affect previously registered valildators", function () {
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


module("Model._parseAttributeNotation");

test("returns false unless provided notation is string", function () {
  ok( ! Model._parseAttributeNotation(),       'if argument is not specified');
  ok( ! Model._parseAttributeNotation(null),   'if argument is null');
  ok( ! Model._parseAttributeNotation(1234),   'if argument is number');
  ok( ! Model._parseAttributeNotation(true),   'if argument is boolean true');
  ok( ! Model._parseAttributeNotation(false),  'if argument is boolean false');
  ok( ! Model._parseAttributeNotation([]),     'if argument is array');
  ok( ! Model._parseAttributeNotation({}),     'if argument is object');
  ok( ! Model._parseAttributeNotation(/re/),   'if argument is regexp');
  ok( ! Model._parseAttributeNotation($.noop), 'if argument is function');
});

test("returns false if provided notation is invalid", function () {
  ok( ! Model._parseAttributeNotation('id number'),     "invalid if first token—attribute name—is NOT within brackets");
  ok( ! Model._parseAttributeNotation('[1d] number'),   "invalid if attribute name is not a-Z string");
  ok( ! Model._parseAttributeNotation('[slug] str1ng'), "invalid if there is a non a-Z char in following after brackets validator names");
  ok( ! Model._parseAttributeNotation('[] number'),     "invalid if there is no attribute name between the brackets");
  ok( ! Model._parseAttributeNotation('[]'),            "invalid if there is no attribute name between the brackets and no validator names after them");
});

test("returns result if provided notation is valid", function () {
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

test("trimmed provided notation is or not, it does not affect the result", function () {
  ok( Model._parseAttributeNotation(' [id] ')            );
  ok( Model._parseAttributeNotation(' [id] number ')     );
  ok( Model._parseAttributeNotation(' [id] number nil ') );
  ok( ! Model._parseAttributeNotation(' [] ')            );
  ok( ! Model._parseAttributeNotation(' [] string ')     );
  ok( ! Model._parseAttributeNotation(' [1d] string ')   );
  ok( ! Model._parseAttributeNotation(' [id] str1ng ')   );
});


module("Class creation", {
  teardown: function () {
    Model.classes = [];
  }
});

test( "fails without keyword `new`", function () {
  throws(function () { var Note = Model(); }, /M01/ );
});

test( "fails unless 1st argument is a string", function () {
  throws(function () { var Note = new Model(); },         /M02/, 'fails if 1st argument is not specified');
  throws(function () { var Note = new Model(null); },     /M02/, 'fails if 1st argument is null');
  throws(function () { var Note = new Model(1234); },     /M02/, 'fails if 1st argument is number');
  throws(function () { var Note = new Model(true); },     /M02/, 'fails if 1st argument is boolean true');
  throws(function () { var Note = new Model(false); },    /M02/, 'fails if 1st argument is boolean false');
  throws(function () { var Note = new Model($.noop); },   /M02/, 'fails if 1st argument is function');
  throws(function () { var Note = new Model([]); },       /M02/, 'fails if 1st argument is array');
  throws(function () { var Note = new Model('string'); }, /M03/, 'passes if 1st argument is string');
});

test( "fails unless 2nd argument is not a plain object", function () {
  throws(function () { var Note = new Model('Note'); },           /M03/, 'fails if 2nd argument is not specified');
  throws(function () { var Note = new Model('Note', null); },     /M03/, 'fails if 2nd argument is null');
  throws(function () { var Note = new Model('Note', 1234); },     /M03/, 'fails if 2nd argument is number');
  throws(function () { var Note = new Model('Note', true); },     /M03/, 'fails if 2nd argument is boolean true');
  throws(function () { var Note = new Model('Note', false); },    /M03/, 'fails if 2nd argument is boolean false');
  throws(function () { var Note = new Model('Note', $.noop); },   /M03/, 'fails if 2nd argument is function');
  throws(function () { var Note = new Model('Note', 'string'); }, /M03/, 'fails if 2nd argument is string');
  throws(function () { var Note = new Model('Note', []); },       /M03/, 'fails if 2nd argument is array');
  throws(function () { var Note = new Model('Note', {}); },       /M04/, 'passes if 2nd argument is a plain object');
});

test( "fails if options contain no attributes array", function () {
  throws(function () { var Note = new Model('Note', {}); },                       /M04/, 'fails if attributes omitted');
  throws(function () { var Note = new Model('Note', { attributes: null }); },     /M04/, 'fails if attributes is null');
  throws(function () { var Note = new Model('Note', { attributes: 1234 }); },     /M04/, 'fails if attributes is number');
  throws(function () { var Note = new Model('Note', { attributes: true }); },     /M04/, 'fails if attributes is boolean true');
  throws(function () { var Note = new Model('Note', { attributes: false }); },    /M04/, 'fails if attributes is boolean false');
  throws(function () { var Note = new Model('Note', { attributes: $.noop }); },   /M04/, 'fails if attributes is function');
  throws(function () { var Note = new Model('Note', { attributes: 'string' }); }, /M04/, 'fails if attributes is string');
  throws(function () { var Note = new Model('Note', { attributes: {} }); },       /M04/, 'fails if attributes is object');
  throws(function () { var Note = new Model('Note', { attributes: [] }); },       /M04/, 'fails if attributes array is empty');
});

test("fails if at least one options attributes array element is not a valid attribute notation string", function () {
  throws(function () { var Note = new Model('Note', { attributes: [ undefined ] }); }, /M05/, 'fails if one of attribute notations is undefined');
  throws(function () { var Note = new Model('Note', { attributes: [ null ] }); },      /M05/, 'fails if one of attribute notations is null');
  throws(function () { var Note = new Model('Note', { attributes: [ 1234 ] }); },      /M05/, 'fails if one of attribute notations is number');
  throws(function () { var Note = new Model('Note', { attributes: [ true ] }); },      /M05/, 'fails if one of attribute notations is boolean true');
  throws(function () { var Note = new Model('Note', { attributes: [ false ] }); },     /M05/, 'fails if one of attribute notations is boolean false');
  throws(function () { var Note = new Model('Note', { attributes: [ $.noop ] }); },    /M05/, 'fails if one of attribute notations is function');
  throws(function () { var Note = new Model('Note', { attributes: [ [] ] }); },        /M05/, 'fails if one of attribute notations is array');
  throws(function () { var Note = new Model('Note', { attributes: [ {} ] }); },        /M05/, 'fails if one of attribute notations is object');
  throws(function () { var Note = new Model('Note', { attributes: [ 'string' ] }); },  /M05/, 'fails if one of attribute notations is invalid notation string');
});

test("fails if at least one attribute's description is not correctly formatted", function () {
  throws(function () {
    var Note = new Model('Note', {
      attributes: [
        '[id] number',
        '[title] string',
        '1nc0rrect attr1bute n0tat10n'
      ]
    });
  },
  /M05/ );
});

test("fails if attribute is described with unexistent validator", function () {
  throws(function () {
    var Note = new Model('Note', {
      attributes: [
        '[id] number',
        '[title] string',
        '[description] unexistent'
      ]
    });
  },
  /M06/ );
});

test("class knows its name and Model remembers created class by its name", function () {
  var Note = new Model('Note', {
      attributes: [
        '[id] number',
        '[title] string'
      ]
    }),
    Post = new Model('Post', {
      attributes: [
        '[slug] number',
        '[title] string',
        '[body] string'
      ]
    });

  ok( Note.className == 'Note');
  ok( Post.className == 'Post');
  ok( Model.classes.Note == Note );
  ok( Model.classes.Post == Post );

  ok( objectSize(Model.classes) == 2 );
});


test( "fails if class with specified name already exists", function () {
  throws( function () {
    var Note = new Model('Note', {
      attributes: [
        '[id] number',
        '[title] string'
      ]
    });
    Note = new Model('Note', {
      attributes: [
        '[id] number',
        '[title] string'
      ]
    });
  },
  /M07/ );
});

test("Class.attributes should contain array of declared instance attribute names", function () {
  var Note = new Model('Note', {
      attributes: [
        '[id] number',
        '[title] string'
      ]
    }),
    Post = new Model('Post', {
      attributes: [
        '[slug] number',
        '[title] string',
        '[body] string'
      ]
    });
  deepEqual( Note.attributes, [ 'id', 'title' ]);
  deepEqual( Post.attributes, [ 'slug', 'title', 'body' ]);
});

test("Class.validators should be a map of attrName to validators", function () {
  var Note = new Model('Note', {
      attributes: [
        '[id] nonnull number',
        '[title] nonnull nonempty string'
      ]
    });
  deepEqual( Note._validators.id, [ 'nonnull', 'number' ]);
  deepEqual( Note._validators.title, [ 'nonnull', 'nonempty', 'string' ]);
});

test("Class.idAttr is first attribute declared", function () {
  var Note = new Model('Note', {
      attributes: [
        '[id] number',
        '[title] string'
      ]
    }),
    Post = new Model('Post', {
      attributes: [
        '[slug] number',
        '[title] string',
        '[body] string'
      ]
    });
  ok( Note.idAttr === 'id');
  ok( Post.idAttr === 'slug');
});


module("Instance creation", {
  setup: function () {
    Note = new Model('Note', {
      attributes: [
        '[id] number',
        '[title] string'
      ]
    });
  },
  teardown: function () {
    delete Note;
    delete Model.classes.Note;
  }
});

test("should fail if created without `new` keyword", function () {
  throws( function () {
    var note = Note();
  },
  /C01/,
  'throws exception without `new`' );

  var note = new Note();
  ok( true, 'passes with `new`');
});

test("should fail if provided no data object (nothing considered empty data object)", function () {
  throws( function () { var note = new Note('abc');  }, /C02/, 'fails when provided a string' );
  throws( function () { var note = new Note(12345);  }, /C02/, 'fails when provided a number' );
  throws( function () { var note = new Note(false);  }, /C02/, 'fails when provided a boolean false' );
  throws( function () { var note = new Note(true);  }, /C02/, 'fails when provided a boolean true' );

  var note = new Note;
  ok( true, 'passes when provided nothing');
});

test("obj._data should become populated with data provided on creation", function () {
  var note = new Note;
  ok( note.hasOwnProperty('_data'), 'obj gets own property _data created along with instance');
  ok( $.isPlainObject(note._data), 'obj._data is plain object');

  var note = new Note;
  deepEqual( note._data, {}, 'empty data results in empty copy');

  note = new Note({ id: 123, title: "abc", slug: "aabbcc" });
  deepEqual( note._data, { id: 123, title: "abc" }, 'values for unexisting atrributes get dropped');

  note = new Note({ id: 123, title: "abc" });
  deepEqual( note._data, { id: 123, title: "abc" }, 'values for existing attributes get coppied #1: both attrs provided');

  note = new Note({ title: "abc" });
  deepEqual( note._data, { title: "abc" }, 'values for existing attributes get coppied #2: one attr missing');

  note = new Note({ title: "abc" });
  deepEqual( note._data, { title: "abc" }, 'values for existing attributes get coppied #3: one attr missing, one unexisting provided');
});



module("Instance methods", {
  setup: function () {
    Note = new Model('Note', {
      attributes: [
        '[id] number',
        '[title] string'
      ]
    });
  },
  teardown: function () {
    delete Note;
    delete Model.classes.Note;
  }
});

test("obj.isNew getter should return boolean whether istance has idAttr set or not", function () {
  ok( Note.prototype.__lookupGetter__('isNew'), 'isNew getter exists on Class');

  var note = new Note({ id: 123, title: 'abc' });
  ok( !note.isNew, 'returns false if idAttr is set');

  note = new Note({ title: 'abc' });
  ok( note.isNew, 'returns true if idAttr is NOT set');
});

test("obj._get method should return actual attribute value if it is set", function () {
  var noteData = { id: 123, title: 'abc' },
    note = new Note(noteData);

  ok( note._get('id') === 123 );
  ok( note._get('title') === 'abc' );
});

test("obj._set method should set a value of an attribute", function () {
  var noteData = { id: 123, title: 'abc' },
    note = new Note(noteData);

  ok( note._set('title', 'new') === undefined, "_set should return nothing");
  ok( note._get('title') === 'new', "should have changed the attribute value" );
});

test("obj.get method should return actual attribute values", function () {
  var noteData = { id: 123, title: 'abc' },
    note = new Note(noteData);

  throws( function () { note.get(null, 1, 2); }, /P01/, "fails when any of provided attribute names is not a string");
  throws( function () { note.get('slug'); }, /P01/, "fails when any of provided attribute names are not strings");

  var ret = note.get();
  ok( $.isPlainObject(ret), "should return data object if no argument passed");
  ok( objectSize(ret) === 2, "returned data object should have as many keys as there are attributes in the model");
  deepEqual( ret, note._data, "returned data object should have key-value pairs mirroring real attribute names and corresponding values");
  ok( ret !== noteData, "returned data object should not be (by referecence) exactly that object passed to instance constructor");
  ok( ret !== note._data, "returned data object should not be (by referecence) obj._data");

  ok( note.get('title') === 'abc', "should return single value when one attribute name is passed");

  var ret = note.get('id', 'title');
  ok( $.isPlainObject(ret), "should return data object if more than one attribute name is passed");
  ok( objectSize(ret) == 2, "returned data object should have exactly same number of keys as number of attibute arguments passed");
  ok( ret.id === 123 && ret.title === 'abc', "returned object should have key-value pairs mirroring real attribute names and corresponding values");
});

test("obj.set method should set new attribute values", function () {
  var noteData = { id: 123, title: 'abc', text: 'text' },
    note = new Note(noteData);

  throws( function () { note.set(); }, /P02/, "should fail if no arguemnts provided");
  throws( function () { note.set('title'); }, /P02/, "should fail if only attribute name provided");
  throws( function () { note.set('slug', 123); }, /P02/, "should fail if attribute name provided is invalid");
  ok( note.set('title', 'boom') === undefined, "should return undefined");
  ok( note.get('title') == 'boom', "should change the value returned afterwards by the get method");
});


test("obj.data() should return actual data stored in a model instance", function () {
  var noteData = { id: 123, title: 'abc', text: 'text' },
    note = new Note(noteData);

  ok( typeof note.data == 'function', "returned object should be a function");
  ok( note.data() !== note._data, "returned object shouldn't be a reference to a private _data property");
  ok( note.data() !== noteData, "returned object shouldn't be a reference to data provided to a constructor");

  deepEqual( objectKeys(note.data()), Note.attributes, "keys in returned object should be same as Class attributes");
});


//!
test("obj.data should be iterable and contain getters for all attributes", function () {
  var noteData = { id: 123, title: 'abc', text: 'text' },
    note = new Note(noteData);

  var keys = [];
  for (var k in note.data) keys.push(k);

  deepEqual(keys, ['id', 'title']);

  ok( note.data.__lookupGetter__('id') );
  ok( note.data.id === 123);

  ok( note.data.__lookupGetter__('title') );
  ok( note.data.title === 'abc');
});

//!
test("obj.data should also contain setters for all attributes", function () {
  var noteData = { id: 123, title: 'abc', text: 'text' },
    note = new Note(noteData);

  ok( note.data.__lookupSetter__('id') );
  ok( note.data.__lookupSetter__('title') );

  note.data.title = 'new';
  ok( note.data.title === 'new');
});

//!
  test("obj.data= should be a setter for the instance to set multiple attribute values in the other way", function () {
  var noteData = { id: 123, title: 'abc', text: 'text' },
    note = new Note(noteData);

  note.data = {
    id: 321,
    title: "new"
  };

  ok( note.data.id === 321 );
  ok( note.data.title === 'new' );
});


test("obj.data= fails unless right-hand is a plain object", function () {
  var noteData = { id: 123, title: 'abc', text: 'text' },
    note = new Note(noteData);

  throws(function () { note.data = 1234; },      /C03/, "fails if right-hand is a number");
  throws(function () { note.data = null; },      /C03/, "fails if right-hand is null");
  throws(function () { note.data = undefined; }, /C03/, "fails if right-hand is undefined");
  throws(function () { note.data = true; },      /C03/, "fails if right-hand is boolean true");
  throws(function () { note.data = false; },     /C03/, "fails if right-hand is boolean false");
  throws(function () { note.data = $.noop; },    /C03/, "fails if right-hand is a function");
  throws(function () { note.data = 'str'; },     /C03/, "fails if right-hand is a string");
  throws(function () { note.data = []; },        /C03/, "fails if right-hand is an array");
});

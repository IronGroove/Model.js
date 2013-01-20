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
note._changes  // { title: "Unknown" }
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





test("Model.classes should be there", function () {
  ok( $.isPlainObject(Model.classes) );
});

test("Model._classEventNames should be there", function () {
  deepEqual( Model._classEventNames, [ 'initialize', 'change' ] );
});

test("Model._instanceEventNames should be there", function () {
  deepEqual( Model._instanceEventNames, [ 'change', 'persist' ] );
});

module("Model validators");

test("Model.errCodes: there should be three codes", function () {
  ok( Model.errCodes,            'Model.errCodes'            );
  ok( Model.errCodes.WRONG_TYPE, 'Model.errCodes.WRONG_TYPE' );
  ok( Model.errCodes.NULL,       'Model.errCodes.NULL'       );
  ok( Model.errCodes.EMPTY,      'Model.errCodes.EMPTY'      );
});

test("Model._validators (5) should be registered", function () {
  ok( Model._validators['string'], 'string validator exists' );
  ok( Model._validators['string']('123') === undefined, 'string validator returns no errCode having received string argument' );
  ok( Model._validators['string'](123) === Model.errCodes.WRONG_TYPE, 'string validator returns WRONG_TYPE errCode having received non-string argument' );

  //! What about float numbers?
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

test("trimmed provided notation or not, it does not affect the result", function () {
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

test("fails without keyword `new`", function () {
  throws(function () { var Note = Model(); }, /M01/ );
});

test("fails unless 1st argument is a string", function () {
  throws(function () { var Note = new Model(); },         /M02/, 'fails if 1st argument is not specified');
  throws(function () { var Note = new Model(null); },     /M02/, 'fails if 1st argument is null');
  throws(function () { var Note = new Model(1234); },     /M02/, 'fails if 1st argument is number');
  throws(function () { var Note = new Model(true); },     /M02/, 'fails if 1st argument is boolean true');
  throws(function () { var Note = new Model(false); },    /M02/, 'fails if 1st argument is boolean false');
  throws(function () { var Note = new Model($.noop); },   /M02/, 'fails if 1st argument is function');
  throws(function () { var Note = new Model([]); },       /M02/, 'fails if 1st argument is array');
  throws(function () { var Note = new Model('string'); }, /M03/, 'passes if 1st argument is string');
});

test("fails unless 2nd argument is not a plain object", function () {
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

test("fails if options contain no attributes array", function () {
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
  ok( objectSize(Model.classes) == 2 );
  ok( Model.classes.Note == Note );
  ok( Model.classes.Post == Post );
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

test("Class._validators should be a map of attrName to validators", function () {
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


module("Class attributes and methods", {
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

test("Class._callbacks should be there", function () {
  deepEqual( Note._callbacks, {} );
});

test("Class.bind", function () {
  var noop1 = new Function,
    noop2 = new Function,
    noop3 = new Function;

  throws( function () { Note.bind(); },                    /C06/, "should fail if no arguments specified!");
  throws( function () { Note.bind(true); },                /C06/, "should fail if first argument is boolean true!");
  throws( function () { Note.bind(false); },               /C06/, "should fail if first argument is boolean false!");
  throws( function () { Note.bind(undefined); },           /C06/, "should fail if first argument is undefined!");
  throws( function () { Note.bind(1234); },                /C06/, "should fail if first argument is an number!");
  throws( function () { Note.bind(null); },                /C06/, "should fail if first argument is null!");
  throws( function () { Note.bind([]); },                  /C06/, "should fail if first argument is an array!");
  throws( function () { Note.bind({}); },                  /C06/, "should fail if first argument is an object!");
  throws( function () { Note.bind(/re/); },                /C06/, "should fail if first argument is a regexp!");
  throws( function () { Note.bind($.noop); },              /C06/, "should fail if first argument is a function!");
  throws( function () { Note.bind('string'); },            /C06/, "should fail if first argument is an unknown name!");
  throws( function () { Note.bind('str', $.noop); },       /C06/, "should fail if first argument is an unknown name though 2nd is a function!");

  throws( function () { Note.bind('change'); },            /C06/, "should fail if second argument is omitted");
  throws( function () { Note.bind('change', true); },      /C06/, "should fail if second argument is not a function (true boolean supplied)");
  throws( function () { Note.bind('change', false); },     /C06/, "should fail if second argument is not a function (false boolean supplied)");
  throws( function () { Note.bind('change', undefined); }, /C06/, "should fail if second argument is not a function (undefined supplied)");
  throws( function () { Note.bind('change', 1234); },      /C06/, "should fail if second argument is not a function (number supplied)");
  throws( function () { Note.bind('change', null); },      /C06/, "should fail if second argument is not a function (null supplied)");
  throws( function () { Note.bind('change', []); },        /C06/, "should fail if second argument is not a function (array supplied)");
  throws( function () { Note.bind('change', {}); },        /C06/, "should fail if second argument is not a function (object supplied)");
  throws( function () { Note.bind('change', 'str'); },     /C06/, "should fail if second argument is not a function (string supplied)");
  throws( function () { Note.bind('change', /re/); },      /C06/, "should fail if second argument is not a function (regexp supplied)");

  Note.bind('initialize', noop1);
  deepEqual( Note._callbacks, { initialize: [ noop1 ] },
    "should create _callbacks class attribute named after the event bound and "+
    "create an array with a supplied calback in it, if both arguments are "+
    "ok (a known event name and a function)!");

  Note.bind('initialize', noop2);
  deepEqual( Note._callbacks, { initialize: [ noop1, noop2 ] },
    "if other callbacks where previously bound, should populate "+
    "callbacks array for that event with the new callback!");

  Note.bind('initialize', noop3);
  deepEqual( Note._callbacks, { initialize: [ noop1, noop2, noop3 ] },
    "if other callbacks where previously bound, should populate "+
    "callbacks array for that event with the new callback (third)!");

  Note.bind('change', noop1);
  deepEqual( Note._callbacks, { initialize: [ noop1, noop2, noop3 ], change: [ noop1 ] },
    "if a callback is bound to the other event, should create new "+
    "corresponding attribute array in _callbacks and push a bound callback into it!");

  Note.bind('change', noop3);
  deepEqual( Note._callbacks, { initialize: [ noop1, noop2, noop3 ], change: [ noop1, noop3 ] },
    "if a duplicate callback is being bound to the same event, "+
    "let it happen!");
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
  throws( function () { var note = Note(); }, /C01/, 'throws exception without `new`' );
  var note = new Note();
  ok( true, 'passes with `new`');
});

test("shouldn't fail if receives nothing", function () {
  var note = new Note;
  ok( true, 'passes when provided nothing');
});

test("should fail if Class constructor is passed 1 argument and it is neither boolean, nor data object", function () {
  throws( function () { var note = new Note('abc'); }, /C02/, 'fails when receives a string' );
  throws( function () { var note = new Note(12345); }, /C02/, 'fails when receives a number' );
  throws( function () { var note = new Note([]); },    /C02/, 'fails when receives an array' );
  throws( function () { var note = new Note(null);  }, /C02/, 'fails when receives null' );
  throws( function () { var note = new Note(undefined);  }, /C02/, 'fails when receives explicit undefined' );
  throws( function () { var note = new Note(/re/);  }, /C02/, 'fails when receives a regexp' );

  var note = new Note(false);
  ok( true, 'passes when receives false');

  var note = new Note({});
  ok( true, 'passes when receives a plain object');
});

test("should fail if receives 2 arguments and they are not a boolean with a plain object data", function () {
  throws( function () { var note = new Note('abc', {}); },     /C03/, 'fails if first argument is not boolean' );
  throws( function () { var note = new Note(true, 'abc'); },   /C03/, 'fails if second argument is not a plain object' );

  var note = new Note(false, {});
  ok( true, 'passes when 1st arg is boolean and second is plain object');
});

test("should fail if given more than 2 arguments", function () {
  throws( function () { var note = new Note(true, { title: "String" }, 1); }, /C04/, 'fails when 2 first arguments are correct and provided any 3rd argument' );
});

test("should fail if explicit persistance flag is true and no idAttr value is provided in data obj", function () {
  throws(function () { var note = new Note(true, { title: 'abc'}); }, /C05/);
  throws(function () { var note = new Note(true); },                  /C05/);
  throws(function () { var note = new Note(true, {}); },              /C05/);

  var note = new Note(true, { id: 1212 });
  ok( true );
});

test("instance._data should become populated with data provided on creation", function () {
  var note = new Note;
  ok( note.hasOwnProperty('_data'), 'instance gets own property _data created along with instance');
  ok( $.isPlainObject(note._data), 'instance._data is plain object');

  var note = new Note;
  deepEqual( note._data, {}, 'empty data results in empty copy');

  note = new Note({ id: 123, title: "abc", slug: "aabbcc" });
  deepEqual( note._data, { id: 123, title: "abc" }, 'values for unexisting atrributes get dropped');

  note = new Note({ id: 123, title: "abc" });
  deepEqual( note._data, { id: 123, title: "abc" }, 'values for existing attributes get coppied #1: both attrs provided');

  note = new Note({ title: "abc" });
  deepEqual( note._data, { title: "abc" }, 'values for existing attributes get coppied #2: one attr missing');

  note = new Note({ title: "abc", slug: "aabbcc" });
  deepEqual( note._data, { title: "abc" }, 'values for existing attributes get coppied #3: one attr missing, one unexisting provided');
});


module("Instance attributes and methods", {
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

test("instance.isNew getter should return boolean whether istance has idAttr set or not", function () {
  ok( Note.prototype.__lookupGetter__('isNew'), 'isNew getter exists on Class');

  var note = new Note({ id: 123, title: 'abc' });
  ok( !note.isNew, 'returns false if idAttr is set');

  note = new Note({ title: 'abc' });
  ok( note.isNew, 'returns true if idAttr is NOT set');
});

test("instance.isPersisted", function () {
  ok( Note.prototype.__lookupGetter__('isPersisted'), 'isPersisted getter exists on Class');

  var note = new Note;
  ok( !note.isPersisted );

  var note = new Note(false);
  ok( !note.isPersisted );

  var note = new Note(false, { title: "Some" });
  ok( !note.isPersisted );

  var note = new Note({ id: 1212 });
  ok( note.isPersisted );

  //NOTE This instance is considered new, as if it should be created with a known id.
  var note = new Note(false, { id: 1212 });
  ok( !note.isPersisted );

  //! Add other tests ckecking things after note.persist() method call.
});

test("instance.isChanged", function () {
  ok( Note.prototype.__lookupGetter__('isChanged'), 'isChanged getter exists on Class');
  var note = new Note({ id: 1212, title: "ABC" });
  ok( !note.isChanged, "persisting instance should not be changed right after initializing");
  note.data.title = "NEW";
  ok( note.isChanged, "instance should be changed after changing any attribute value");

  note.data.title = "ABC";
  ok( !note.isChanged, "instance should not be changed when old value is explicitly changed to the initial one");
  //! Add other tests checking things after note.revert() method.
});

//!
test("instance._changes should reflect currently changed attributes and their persisted values", function () {
  var note = new Note({ id: 1212, title: "ABC" });

  note.data.title = "NEW";
  deepEqual( note._changes, { title: "ABC" });

  note.data.id = 123;
  deepEqual( note._changes, { id: 1212, title: "ABC" });

  note.data.id = 1234;
  deepEqual( note._changes, { id: 1212, title: "ABC" });

  note.data.id = 1212;
  deepEqual( note._changes, { title: "ABC" });

  note.data.title = "ABC"
  deepEqual( note._changes, {});
});

test("instance._get method should return actual attribute value if it is set", function () {
  var noteData = { id: 123, title: 'abc' },
    note = new Note(noteData);

  ok( note._data.id === 123 );
  ok( note._data.title === 'abc' );
  ok( note._get('id') === 123 );
  ok( note._get('title') === 'abc' );
});

test("instance._set method should set a value of an attribute", function () {
  var noteData = { id: 123, title: 'abc' },
    note = new Note(noteData);

  ok( note._set('title', 'new') === undefined, "_set should return nothing");
  ok( note._data.title === 'new' );
});

test("instance.data() should return actual data stored in a model instance", function () {
  var noteData = { id: 123, title: 'abc', text: 'text' },
    note = new Note(noteData);

  ok( typeof note.data == 'function', "returned should be a function");
  ok( note.data() !== note._data, "returned object shouldn't be a reference to a private _data property");
  ok( note.data() !== noteData, "returned object shouldn't be a reference to data provided to a constructor");

  deepEqual( objectKeys(note.data()), Note.attributes, "keys in returned object should be same as Class attributes");
});

test("instance.get method should return actual attribute values", function () {
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

test("instance.set method should set new attribute values", function () {
  var noteData = { id: 123, title: 'abc', text: 'text' },
    note = new Note(noteData);

  throws( function () { note.set(); }, /P02/, "should fail if no arguemnts provided");
  throws( function () { note.set('title'); }, /P02/, "should fail if only attribute name provided");
  throws( function () { note.set('slug', 123); }, /P02/, "should fail if attribute name provided is invalid");
  ok( note.set('title', 'boom') === undefined, "should return undefined");
  ok( note.get('title') == 'boom', "should change the value returned afterwards by the get method");
});


//!
test("instance.data should be iterable and contain getters for all attributes", function () {
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

test("instance.data should also contain setters for all attributes", function () {
  var noteData = { id: 123, title: 'abc', text: 'text' },
    note = new Note(noteData);

  ok( note.data.__lookupSetter__('id') );
  ok( note.data.__lookupSetter__('title') );

  note.data.title = 'new';
  ok( note.data.title === 'new');
});

test("instance.data= should be a setter for the instance to set multiple attribute values in the other way", function () {
  var noteData = { id: 123, title: 'abc', text: 'text' },
    note = new Note(noteData);

  note.data = { id: 321, title: "new" };

  ok( note.data.id === 321 );
  ok( note.data.title === 'new' );
});


test("instance.data= fails unless right-hand is a plain object", function () {
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

test("instance._callbacks should be there", function () {
  var note = new Note({ id: 123, title: 'abc', text: 'text' });
  deepEqual( note._callbacks, {});
});

test("instance.bind", function () {
  var note = new Note({ id: 123, title: 'abc', text: 'text' }),
    noop1 = new Function,
    noop2 = new Function,
    noop3 = new Function;

  throws( function () { note.bind(); },                    /I06/, "should fail if no arguments specified!");
  throws( function () { note.bind(true); },                /I06/, "should fail if first argument is boolean true!");
  throws( function () { note.bind(false); },               /I06/, "should fail if first argument is boolean false!");
  throws( function () { note.bind(undefined); },           /I06/, "should fail if first argument is undefined!");
  throws( function () { note.bind(1234); },                /I06/, "should fail if first argument is an number!");
  throws( function () { note.bind(null); },                /I06/, "should fail if first argument is null!");
  throws( function () { note.bind([]); },                  /I06/, "should fail if first argument is an array!");
  throws( function () { note.bind({}); },                  /I06/, "should fail if first argument is an object!");
  throws( function () { note.bind(/re/); },                /I06/, "should fail if first argument is a regexp!");
  throws( function () { note.bind($.noop); },              /I06/, "should fail if first argument is a function!");
  throws( function () { note.bind('string'); },            /I06/, "should fail if first argument is an unknown name!");
  throws( function () { note.bind('str', $.noop); },       /I06/, "should fail if first argument is an unknown name though 2nd is a function!");

  throws( function () { note.bind('change'); },            /I06/, "should fail if second argument is omitted");
  throws( function () { note.bind('change', true); },      /I06/, "should fail if second argument is not a function (true boolean supplied)");
  throws( function () { note.bind('change', false); },     /I06/, "should fail if second argument is not a function (false boolean supplied)");
  throws( function () { note.bind('change', undefined); }, /I06/, "should fail if second argument is not a function (undefined supplied)");
  throws( function () { note.bind('change', 1234); },      /I06/, "should fail if second argument is not a function (number supplied)");
  throws( function () { note.bind('change', null); },      /I06/, "should fail if second argument is not a function (null supplied)");
  throws( function () { note.bind('change', []); },        /I06/, "should fail if second argument is not a function (array supplied)");
  throws( function () { note.bind('change', {}); },        /I06/, "should fail if second argument is not a function (object supplied)");
  throws( function () { note.bind('change', 'str'); },     /I06/, "should fail if second argument is not a function (string supplied)");
  throws( function () { note.bind('change', /re/); },      /I06/, "should fail if second argument is not a function (regexp supplied)");

  note.bind('change', noop1);
  deepEqual( note._callbacks, { change: [ noop1 ] },
    "should create _callbacks attribute named after the event bound and "+
    "create an array with a supplied calback in it, if both arguments are "+
    "ok (a known event name and a function!");

  note.bind('change', noop2);
  deepEqual( note._callbacks, { change: [ noop1, noop2 ] },
    "if other callbacks where previously bound, should populate "+
    "callbacks array for that event with the new callback!");

  note.bind('change', noop3);
  deepEqual( note._callbacks, { change: [ noop1, noop2, noop3 ] },
    "if other callbacks where previously bound, should populate "+
    "callbacks array for that event with the new callback (third)!");

  note.bind('persist', noop3);
  deepEqual( note._callbacks, { change: [ noop1, noop2, noop3 ], persist: [ noop3 ] },
    "if a callback is bound to the other event, should create new "+
    "corresponding attribute array in _callbacks and push a bound callback into it!");

  note.bind('persist', noop3);
  deepEqual( note._callbacks, { change: [ noop1, noop2, noop3 ], persist: [ noop3, noop3 ] },
    "if a duplicate callback is being bound to the same event, "+
    "let it happen!");
});

test("instance._trigger", function () {
  var strC = '', strI = '', strCI = '',
    note = new Note({ id: 123, title: "ABC" });

  // should fail unless 1st argument is not a string name of a known event
  throws( function () { note._trigger(); },          /I07/, "should fail if no arguments specified!");
  throws( function () { note._trigger(true); },      /I07/, "should fail if first argument is boolean true!");
  throws( function () { note._trigger(false); },     /I07/, "should fail if first argument is boolean false!");
  throws( function () { note._trigger(undefined); }, /I07/, "should fail if first argument is undefined!");
  throws( function () { note._trigger(1234); },      /I07/, "should fail if first argument is an number!");
  throws( function () { note._trigger(null); },      /I07/, "should fail if first argument is null!");
  throws( function () { note._trigger([]); },        /I07/, "should fail if first argument is an array!");
  throws( function () { note._trigger({}); },        /I07/, "should fail if first argument is an object!");
  throws( function () { note._trigger(/re/); },      /I07/, "should fail if first argument is a regexp!");
  throws( function () { note._trigger($.noop); },    /I07/, "should fail if first argument is a function!");
  throws( function () { note._trigger('string'); },  /I07/, "should fail if first argument is an unknown name!");
  note._trigger('change');
  ok (true, "should pass (should do nothing if a known event is triggered though no handlers were previousy bound)");

  Note.bind('change', function () { strC += 'C'; strCI += 'X'; });
  note._trigger('change');
  ok( strC == "C", "should run handlers bound to Class if any");

  Note.bind('change', function () { strC += 'A'; strCI += 'Y'; });
  note._trigger('change');
  ok( strC == "CCA", "should run handlers bound to Class in the order they were bound if there are more than one");

  note.bind('change', function () { strI += 'B'; strCI += 'Z'; });
  note._trigger('change');
  ok( strI == "B", "should run handlers bound to instance if any");

  note.bind('change', function () { strI += 'E'; strCI += '0'; });
  note._trigger('change');
  ok( strI == "BBE", "should run handlers bound to instance in the order theu were bound if there are more than one");

  ok( strCI == "XXYXYZXYZ0", "should run handlers bound to Class before handlers bound to an instance");

  var result = '';
  note.bind('change', function (instance) {
    result += instance.data.id;
    result += this.data.title;
  });
  note._trigger('change');

  ok( result == '123ABC', "handler function should receive instance in a 1dt argument and in context");
});

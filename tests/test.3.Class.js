module("Class");

test("consistency",
function () {
  ok( $.isFunction(Model.private.Class.prototype.validate) );
  ok( $.isFunction(Model.private.Class.prototype.bind) );
});


module("Class creation", {
  teardown: function () {
    Model._classes = {};
  }
});

test("consistency",
function () {
  var Note = new Model('Note', function () {
    this.attr('id!', 'number');
    this.attr('title', 'string');
  });
  var Post = new Model('Post', function () {
    this.attr('slug', 'string');
    this.attr('title', 'string');
  });
  ok( typeof Note.idAttr == 'string' );
  ok( Post.idAttr == undefined );
  ok( $.isArray(Note.requiredAttributes) && $.isArray(Post.requiredAttributes) );
  ok( $.isArray(Note.attributeNames) && $.isArray(Post.attributeNames) );
  ok( $.isPlainObject(Note.attributeValidators) && $.isPlainObject(Post.attributeValidators) );
});

test("should create new ModelConfigurator instance and call Class configuration passed with it in context",
function () {
  var realMethod = Model.private.ModelConfigurator,
    called = false;
  Model.private.ModelConfigurator = function MC(cls) {
    if (this.constructor.name == 'MC') called = true;
    return new realMethod(cls);
  }
  $.extend(Model.private.ModelConfigurator, realMethod);
  var Note = new Model('Note', function () {
    this.attr('id!', 'number');
    this.attr('title', 'string');
  });
  ok( called );
  Model.private.ModelConfigurator = realMethod;
});

test("should call ModelConfigurator.processRawAttributes",
function () {
  var realMethod = Model.private.ModelConfigurator.processRawAttributes,
    called = false;
  Model.private.ModelConfigurator.processRawAttributes = function () {
    called = true;
    return realMethod.apply(null, arguments);
  };
  var Note = new Model('Note', function () {
    this.attr('id!', 'number');
    this.attr('title', 'string');
  });
  ok( called );
  Model.private.ModelConfigurator.processRawAttributes = realMethod;
});



module("Class instance creation", {
  setup: function () {
    Note = new Model('Note', function () {
      this.attr('id!', 'number');
      this.attr('title', 'string');
    });
  },
  teardown: function () {
    delete Note;
    Model._classes = {};
  }
});

test("should work with `new` keyword only",
function () {
  throws( function () { var note = Note(); }, /C001/, 'throws exception without `new`' );
  var note = new Note({ id: 123 }); ok( true, 'passes with `new`');
});

test("should not fail when provided nothing",
function () {
  var note = new Note(); ok( true, 'passes when provided empty data object');
  var note = new Note;   ok( true, 'passes when provided nothing');
});

test("should fail when constructor is passed 1 argument and it is neither a boolean, nor a data object",
function () {
  throws( function () { var note = new Note('abc'); },     /C002/, 'string' );
  throws( function () { var note = new Note(12345); },     /C002/, 'number' );
  throws( function () { var note = new Note([]); },        /C002/, 'array' );
  throws( function () { var note = new Note(null);  },     /C002/, 'null' );
  throws( function () { var note = new Note(undefined); }, /C002/, 'explicit undefined' );
  throws( function () { var note = new Note(/re/);  },     /C002/, 'regexp' );
  var note = new Note(false); ok( true, 'passes when receives false');
  var note = new Note({});    ok( true, 'passes when receives a plain object');
});

test("should fail if receives 2 arguments and they are not a boolean with a plain object data",
function () {
  throws( function () { var note = new Note('abc', {}); },     /C003/, 'fails if first argument is not boolean' );
  throws( function () { var note = new Note(true, 'abc'); },   /C003/, 'fails if second argument is not a plain object' );
  var note = new Note(false, { id: 123 }); ok( true, 'passes when 1st arg is boolean and second is plain object');
});

test("should fail when provided more than 2 arguments",
function () {
  throws(function () { var note = new Note(true, { title: "String" }, 1); }, /C004/, 'fails when 2 first arguments are correct and provided any 3rd argument' );
});

test("general failures when idAttr is defined",
function () {
  throws(function () { var note = new Note(true); },                    /C005/, 'cannot persist on creation without data (nothing passed)');
  throws(function () { var note = new Note(true, {}); },                /C005/, 'cannot persist on creation without data (empty data passed)');
  throws(function () { var note = new Note(true, { title: "Some" }); }, /C005/, 'cannot persist on creation without idAttr value present');
  var note = new Note(true, { id: 123 });
  ok( true, 'can persist if idAttr value is present');
});

test("general failures when idAttr is not defined",
function () {
  var Note = new Model('Note2', function () {
    this.attr('slug', 'string');
    this.attr('title', 'string');
  });

  throws(function () { var note = new Note; },           /C006/, 'cannot persist on creation without data (nothing passed and no persistanceFlag)');
  throws(function () { var note = new Note({}); },       /C006/, 'cannot persist on creation without data (empty data passed and no persistanceFlag)');
  throws(function () { var note = new Note(true); },     /C006/, 'cannot persist on creation without data (nothing passed and persistanceFlag is true)');
  throws(function () { var note = new Note(true, {}); }, /C006/, 'cannot persist on creation without data (empty data passed and persistanceFlag is true)');
  var note = new Note(true, { slug: '123' });
  ok( true, 'can persist if at least some data is present');
});

test("consistancy of new instances",
function () {
  var note = new Note;

  ok( note.hasOwnProperty('_callbacks'), 'instance gets own property _callbacks upon creation');
  deepEqual( note._callbacks, {}, "has empty _callbacks object upon creation");

  ok( note.hasOwnProperty('_errors'), 'instance gets own property _errors upon creation');
  deepEqual( note._errors, {}, "has empty _errors object upon creation");

  ok( note.hasOwnProperty('_changes'), 'instance gets own property _changes upon creation');
  deepEqual( note._changes, {}, "has empty _changes object upon creation");

  ok( note.hasOwnProperty('_changesAfterValidation'), 'instance gets own property _changesAfterValidation upon creation');
  ok( note._changesAfterValidation == true, "has _changesAfterValidation property set to true upon creation");

  ok( note.hasOwnProperty('_persisted'), 'instance gets own property _persisted upon creation');
  ok( note._persisted == 1 || note._persisted == 0, "has _persisted property is set to either 1 or 0 upon creation");

  ok( note.hasOwnProperty('_data'), 'instance gets own property _data upon creation');
  ok( $.isPlainObject(note._data), "has _data object upon creation");

  ok( note.hasOwnProperty('_data2'), 'instance gets own property _data2 upon creation');
  ok( $.isFunction(note._data2), "has _data2 function upon creation");

  for (var i = 0; i < Note.attributeNames.length; i++) {
    var attrName = Note.attributeNames[i];
    ok( note._data2.__lookupGetter__(attrName) );
    ok( note._data2.__lookupSetter__(attrName) );
  }

  ok( !note.hasOwnProperty('_rawAttributes'), 'instance should not have own property _rawAttributes upon creation');
});

test("instance._data should become populated with data provided on creation",
function () {
  var note = new Note;
  deepEqual( note._data, {}, 'empty data results in empty copy');

  note = new Note({ id: 123, title: "abc", slug: "aabbcc" });
  deepEqual( note._data, { id: 123, title: "abc" }, 'values for unexisting atrributes get dropped');

  var data = { id: 123, title: "abc" };
  note = new Note(data);
  deepEqual( note._data, data, 'values for existing attributes get coppied #1: both attrs provided');
  ok( note._data !== data, 'returned object should not be the same one as passed on creation');

  note = new Note({ title: "abc" });
  deepEqual( note._data, { title: "abc" }, 'values for existing attributes get coppied #2: one attr missing');

  note = new Note({ title: "abc", slug: "aabbcc" });
  deepEqual( note._data, { title: "abc" }, 'values for existing attributes get coppied #3: one attr missing, one unexisting provided');
});

test("should trigger initialize event via instance._trigger",
function () {
  var triggered = null;
  Note.prototype._trigger = function (eventName) { triggered = eventName; }
  var note = new Note;
  ok ( triggered == 'initialize' );
});






module("Class.bind", {
  setup: function () {
    Cls = new Model.private.Class($.noop);
  },
  teardown: function () {
    delete Cls;
  }
});


test("should accept 2 arguments: a valid string eventName and a function eventHandler",
function () {
  throws( function(){ Cls.bind(); },                    /C101/, "should fail if no arguments specified!");
  throws( function(){ Cls.bind(true); },                /C101/, "should fail if first argument is boolean true!");
  throws( function(){ Cls.bind(false); },               /C101/, "should fail if first argument is boolean false!");
  throws( function(){ Cls.bind(undefined); },           /C101/, "should fail if first argument is undefined!");
  throws( function(){ Cls.bind(1234); },                /C101/, "should fail if first argument is an number!");
  throws( function(){ Cls.bind(null); },                /C101/, "should fail if first argument is null!");
  throws( function(){ Cls.bind([]); },                  /C101/, "should fail if first argument is an array!");
  throws( function(){ Cls.bind({}); },                  /C101/, "should fail if first argument is an object!");
  throws( function(){ Cls.bind(/re/); },                /C101/, "should fail if first argument is a regexp!");
  throws( function(){ Cls.bind($.noop); },              /C101/, "should fail if first argument is a function!");
  throws( function(){ Cls.bind('string'); },            /C101/, "should fail if first argument is an unknown name!");
  throws( function(){ Cls.bind('str', $.noop); },       /C101/, "should fail if first argument is an unknown name though 2nd is a function!");

  throws( function(){ Cls.bind('change'); },            /C101/, "should fail if second argument is omitted");
  throws( function(){ Cls.bind('change', true); },      /C101/, "should fail if second argument is not a function (true boolean supplied)");
  throws( function(){ Cls.bind('change', false); },     /C101/, "should fail if second argument is not a function (false boolean supplied)");
  throws( function(){ Cls.bind('change', undefined); }, /C101/, "should fail if second argument is not a function (undefined supplied)");
  throws( function(){ Cls.bind('change', 1234); },      /C101/, "should fail if second argument is not a function (number supplied)");
  throws( function(){ Cls.bind('change', null); },      /C101/, "should fail if second argument is not a function (null supplied)");
  throws( function(){ Cls.bind('change', []); },        /C101/, "should fail if second argument is not a function (array supplied)");
  throws( function(){ Cls.bind('change', {}); },        /C101/, "should fail if second argument is not a function (object supplied)");
  throws( function(){ Cls.bind('change', 'str'); },     /C101/, "should fail if second argument is not a function (string supplied)");
  throws( function(){ Cls.bind('change', /re/); },      /C101/, "should fail if second argument is not a function (regexp supplied)");

  throws( function(){ Cls.bind('change', $.noop, 0); }, /C101/, "should fail when there are more than 2 arguments supplied");
  throws( function(){ Cls.bind('cry', $.noop); },       /C101/, "should fail when an unknown event is being bound");
});

test("should act correctly",
function () {
  var noop1 = new Function,
    noop2 = new Function,
    noop3 = new Function;

  Cls.bind('initialize', noop1);
  deepEqual( Cls._callbacks, { initialize: [ noop1 ] },
    "should create _callbacks class attribute named after the event bound and "+
    "create an array with a supplied calback in it, if both arguments are "+
    "ok (a known event name and a function)!");

  Cls.bind('initialize', noop2);
  deepEqual( Cls._callbacks, { initialize: [ noop1, noop2 ] },
    "if other callbacks where previously bound, should populate "+
    "callbacks array for that event with the new callback!");

  Cls.bind('initialize', noop3);
  deepEqual( Cls._callbacks, { initialize: [ noop1, noop2, noop3 ] },
    "if other callbacks were previously bound, should populate "+
    "callbacks array for that event with the new callback (third)!");

  Cls.bind('change', noop1);
  deepEqual( Cls._callbacks, { initialize: [ noop1, noop2, noop3 ], change: [ noop1 ] },
    "if a callback is bound to the other event, should create new "+
    "corresponding attribute array in _callbacks and push a bound callback into it!");

  Cls.bind('change', noop1);
  deepEqual( Cls._callbacks, { initialize: [ noop1, noop2, noop3 ], change: [ noop1, noop1 ] },
    "if a duplicate callback is being bound to the same event, "+
    "let it happen!");
});



module("Class.validate", {
  setup: function () {
    Cls = new Model.private.Class(function () {
      this.attr('id!', 'number');
      this.attr('title+', 'string');
      this.attr('text', 'string');
    });
  },
  teardown: function () {
    delete Cls;
  }
});

test("argument variants and failures", function () {
  throws(function(){ Cls.validate(); }, /C102/, "fails when no arguments provided");
  throws(function(){ Cls.validate(1,2,3); }, /C102/, "fails when provided more than 2 arguments");
  throws(function(){ Cls.validate(1); }, /C103/, "fails when provided 1 arg and it's not the instance of same Class");

  var instance = new Cls({ title: "ABC" });
  Cls.validate(instance);
  ok( true , "doesn't fail when provided 1 arg and it is the instance of same Class");

  Cls.validate('title', 0);
  ok( true , "doesn't fail when provided 2 args and 1st on is a valid attribute name");

  throws(function(){ Cls.validate('body', 0); }, /C104/, "fails when provided 2 args and 1st on is an invalid attribute name");
});

test("instance", function () {
  var instance = new Cls({ id: 123, title: "ABC" });
  deepEqual( Cls.validate(instance), {}, "returns empty object if instance has no validation errors");

  instance = new Cls(false, {});
  deepEqual( Cls.validate(instance), { id: Model.errCodes.NULL, title: Model.errCodes.NULL }, "should return attributeName-to-errorCode object map if instance has any validation error");

  instance.data.id = 10;
  instance.data.title = 0;
  deepEqual( Cls.validate(instance), { title: Model.errCodes.WRONG_TYPE }, "should return attributeName-to-errorCode object map if instance has any validation error (2)");
});

test("attribute (string validator name)",
function () {
  ok( Cls.validate('id', 1212) === undefined,
    "should return nothing if atribute has a valid value");

  ok( Cls.validate('id', null) == Model.errCodes.NULL,
    "should return Model.errCodes.NULL if attribute's value is null when attribute is required");

  ok( Cls.validate('id', undefined) == Model.errCodes.NULL,
    "should return Model.errCodes.NULL if attributes's value is undefined when attribute is required");

  ok( Cls.validate('text', undefined) === undefined,
    "should return undefined if attribute's value is null when attribute is not required");

  ok( Cls.validate('id', 'string') == Model.errCodes.WRONG_TYPE,
    "should run validators if attibute's value if neither null, not undefined");

  ok( Cls.validate('title', 123) == Model.errCodes.WRONG_TYPE);

  ok( Cls.validate('title', new Date) == Model.errCodes.WRONG_TYPE);
});

test("attribute (array [string validator name, options)",
function () {
  var Cls = new Model.private.Class(function () {
    this.attr('id!', 'number');
    this.attr('title+', 'string');
    this.attr('body', 'string');
    this.attr('lang+', 'string', [ 'in', ['en','ru'] ]);
  });

  ok( Cls.validate('lang', '12') === Model.errCodes.NOT_IN );
  ok( Cls.validate('lang', 'en') === undefined );
});


test("attribute (function)",
function () {
  var Cls = new Model.private.Class(function () {
    this.attr('id!', 'number');
    this.attr('title+', 'string', function (value) {
      if (!value.match(/^[0-9A-Z\ ]+$/g)) return 'lowercase';
    });
    this.attr('body', 'string');
  });

  ok( Cls.validate('title', 'abc') === 'lowercase');
  ok( Cls.validate('title', 'ABC') === undefined );
});

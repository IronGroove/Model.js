module("Instance creation", {
  setup:function(){
    Note = new Model('Note', function () {
      this.attr('id', 'number', true);
      this.attr('title', 'string');
    });
  },
  teardown:function(){
    delete Note;
    delete Model._classes.Note;
  }
});

test("should fail if created without `new` keyword",function(){
  throws(function(){ var note = Note(); }, /C001/, 'throws exception without `new`' );
  var note = new Note();
  ok( true, 'passes with `new`');
});

test("shouldn't fail if receives nothing",function(){
  var note = new Note;
  ok( true, 'passes when provided nothing');
});

test("should fail if Class constructor is passed 1 argument and it is neither boolean, nor data object",function(){
  throws(function(){ var note = new Note('abc'); },     /C002/, 'fails when receives a string' );
  throws(function(){ var note = new Note(12345); },     /C002/, 'fails when receives a number' );
  throws(function(){ var note = new Note([]); },        /C002/, 'fails when receives an array' );
  throws(function(){ var note = new Note(null);  },     /C002/, 'fails when receives null' );
  throws(function(){ var note = new Note(undefined); }, /C002/, 'fails when receives explicit undefined' );
  throws(function(){ var note = new Note(/re/);  },     /C002/, 'fails when receives a regexp' );

  var note = new Note(false);
  ok( true, 'passes when receives false');

  var note = new Note({});
  ok( true, 'passes when receives a plain object');
});

test("should fail if receives 2 arguments and they are not a boolean with a plain object data",function(){
  throws(function(){ var note = new Note('abc', {}); },     /C003/, 'fails if first argument is not boolean' );
  throws(function(){ var note = new Note(true, 'abc'); },   /C003/, 'fails if second argument is not a plain object' );

  var note = new Note(false, {});
  ok( true, 'passes when 1st arg is boolean and second is plain object');
});

test("should fail if given more than 2 arguments",function(){
  throws(function(){ var note = new Note(true, { title: "String" }, 1); }, /C004/, 'fails when 2 first arguments are correct and provided any 3rd argument' );
});

test("should fail if explicit persistance flag is true and no idAttr value is provided in data obj",function(){
  throws(function(){ var note = new Note(true, { title: 'abc'}); }, /C005/);
  throws(function(){ var note = new Note(true); },                  /C005/);
  throws(function(){ var note = new Note(true, {}); },              /C005/);

  var note = new Note(true, { id: 1212 });
  ok( true );
});

test("instance._data should become populated with data provided on creation",function(){
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
  setup:function(){
    Note = new Model('Note', function () {
      this.attr('id', 'number', true);
      this.attr('title', 'string');
    });
  },
  teardown:function(){
    delete Note;
    delete Model._classes.Note;
  }
});

test("instance.isNew getter should return boolean whether istance has idAttr set or not",function(){
  ok( Note.prototype.__lookupGetter__('isNew'), 'isNew getter exists on Class');

  var note = new Note({ id: 123, title: 'abc' });
  ok( !note.isNew, 'returns false if idAttr is set');

  note = new Note({ title: 'abc' });
  ok( note.isNew, 'returns true if idAttr is NOT set');
});

test("instance.isPersisted",function(){
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

test("instance.isChanged",function(){
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
test("instance._changes should reflect currently changed attributes and their persisted values",function(){
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

test("instance._get method should return actual attribute value if it is set",function(){
  var noteData = { id: 123, title: 'abc' },
    note = new Note(noteData);

  ok( note._data.id === 123 );
  ok( note._data.title === 'abc' );
  ok( note._get('id') === 123 );
  ok( note._get('title') === 'abc' );
});

test("instance._set method should set a value of an attribute",function(){
  var noteData = { id: 123, title: 'abc' },
    note = new Note(noteData);

  ok( note._set('title', 'new') === undefined, "_set should return nothing");
  ok( note._data.title === 'new' );
});

test("instance.data() should return actual data stored in a model instance",function(){
  var noteData = { id: 123, title: 'abc', text: 'text' },
    note = new Note(noteData);

  ok( typeof note.data == 'function', "returned should be a function");
  ok( note.data() !== note._data, "returned object shouldn't be a reference to a private _data property");
  ok( note.data() !== noteData, "returned object shouldn't be a reference to data provided to a constructor");

  deepEqual( objectKeys(note.data()), Note.attributeNames, "keys in returned object should be same as Class attributes");
});

test("instance.get method should return actual attribute values",function(){
  var noteData = { id: 123, title: 'abc' },
    note = new Note(noteData);

  throws(function(){ note.get(null, 1, 2); }, /P01/, "fails when any of provided attribute names is not a string");
  throws(function(){ note.get('slug'); }, /P01/, "fails when any of provided attribute names are not strings");

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

test("instance.set method should set new attribute values",function(){
  var noteData = { id: 123, title: 'abc', text: 'text' },
    note = new Note(noteData);

  throws(function(){ note.set(); }, /P02/, "should fail if no arguemnts provided");
  throws(function(){ note.set('title'); }, /P02/, "should fail if only attribute name provided");
  throws(function(){ note.set('slug', 123); }, /P02/, "should fail if attribute name provided is invalid");
  ok( note.set('title', 'boom') === undefined, "should return undefined");
  ok( note.get('title') == 'boom', "should change the value returned afterwards by the get method");
});


//!
test("instance.data should be iterable and contain getters for all attributes",function(){
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

test("instance.data should also contain setters for all attributes",function(){
  var noteData = { id: 123, title: 'abc', text: 'text' },
    note = new Note(noteData);

  ok( note.data.__lookupSetter__('id') );
  ok( note.data.__lookupSetter__('title') );

  note.data.title = 'new';
  ok( note.data.title === 'new');
});

test("instance.data= should be a setter for the instance to set multiple attribute values in the other way",function(){
  var noteData = { id: 123, title: 'abc', text: 'text' },
    note = new Note(noteData);

  note.data = { id: 321, title: "new" };

  ok( note.data.id === 321 );
  ok( note.data.title === 'new' );
});


test("instance.data= fails unless right-hand is a plain object",function(){
  var noteData = { id: 123, title: 'abc', text: 'text' },
    note = new Note(noteData);

  throws(function(){ note.data = 1234; },      /C003/, "fails if right-hand is a number");
  throws(function(){ note.data = null; },      /C003/, "fails if right-hand is null");
  throws(function(){ note.data = undefined; }, /C003/, "fails if right-hand is undefined");
  throws(function(){ note.data = true; },      /C003/, "fails if right-hand is boolean true");
  throws(function(){ note.data = false; },     /C003/, "fails if right-hand is boolean false");
  throws(function(){ note.data = $.noop; },    /C003/, "fails if right-hand is a function");
  throws(function(){ note.data = 'str'; },     /C003/, "fails if right-hand is a string");
  throws(function(){ note.data = []; },        /C003/, "fails if right-hand is an array");
});

test("instance._callbacks should be there",function(){
  var note = new Note({ id: 123, title: 'abc', text: 'text' });
  deepEqual( note._callbacks, {});
});

test("instance.bind",function(){
  var note = new Note({ id: 123, title: 'abc', text: 'text' }),
    noop1 = new Function,
    noop2 = new Function,
    noop3 = new Function;

  throws(function(){ note.bind(); },                    /I06/, "should fail if no arguments specified!");
  throws(function(){ note.bind(true); },                /I06/, "should fail if first argument is boolean true!");
  throws(function(){ note.bind(false); },               /I06/, "should fail if first argument is boolean false!");
  throws(function(){ note.bind(undefined); },           /I06/, "should fail if first argument is undefined!");
  throws(function(){ note.bind(1234); },                /I06/, "should fail if first argument is an number!");
  throws(function(){ note.bind(null); },                /I06/, "should fail if first argument is null!");
  throws(function(){ note.bind([]); },                  /I06/, "should fail if first argument is an array!");
  throws(function(){ note.bind({}); },                  /I06/, "should fail if first argument is an object!");
  throws(function(){ note.bind(/re/); },                /I06/, "should fail if first argument is a regexp!");
  throws(function(){ note.bind($.noop); },              /I06/, "should fail if first argument is a function!");
  throws(function(){ note.bind('string'); },            /I06/, "should fail if first argument is an unknown name!");
  throws(function(){ note.bind('str', $.noop); },       /I06/, "should fail if first argument is an unknown name though 2nd is a function!");

  throws(function(){ note.bind('change'); },            /I06/, "should fail if second argument is omitted");
  throws(function(){ note.bind('change', true); },      /I06/, "should fail if second argument is not a function (true boolean supplied)");
  throws(function(){ note.bind('change', false); },     /I06/, "should fail if second argument is not a function (false boolean supplied)");
  throws(function(){ note.bind('change', undefined); }, /I06/, "should fail if second argument is not a function (undefined supplied)");
  throws(function(){ note.bind('change', 1234); },      /I06/, "should fail if second argument is not a function (number supplied)");
  throws(function(){ note.bind('change', null); },      /I06/, "should fail if second argument is not a function (null supplied)");
  throws(function(){ note.bind('change', []); },        /I06/, "should fail if second argument is not a function (array supplied)");
  throws(function(){ note.bind('change', {}); },        /I06/, "should fail if second argument is not a function (object supplied)");
  throws(function(){ note.bind('change', 'str'); },     /I06/, "should fail if second argument is not a function (string supplied)");
  throws(function(){ note.bind('change', /re/); },      /I06/, "should fail if second argument is not a function (regexp supplied)");

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

test("instance._trigger",function(){
  var strC = '', strI = '', strCI = '',
    note = new Note({ id: 123, title: "ABC" });

  // should fail unless 1st argument is not a string name of a known event
  throws(function(){ note._trigger(); },          /I07/, "should fail if no arguments specified!");
  throws(function(){ note._trigger(true); },      /I07/, "should fail if first argument is boolean true!");
  throws(function(){ note._trigger(false); },     /I07/, "should fail if first argument is boolean false!");
  throws(function(){ note._trigger(undefined); }, /I07/, "should fail if first argument is undefined!");
  throws(function(){ note._trigger(1234); },      /I07/, "should fail if first argument is an number!");
  throws(function(){ note._trigger(null); },      /I07/, "should fail if first argument is null!");
  throws(function(){ note._trigger([]); },        /I07/, "should fail if first argument is an array!");
  throws(function(){ note._trigger({}); },        /I07/, "should fail if first argument is an object!");
  throws(function(){ note._trigger(/re/); },      /I07/, "should fail if first argument is a regexp!");
  throws(function(){ note._trigger($.noop); },    /I07/, "should fail if first argument is a function!");
  throws(function(){ note._trigger('string'); },  /I07/, "should fail if first argument is an unknown name!");
  note._trigger('change');
  ok (true, "should pass (should do nothing if a known event is triggered though no handlers were previousy bound)");

  Note.bind('change',function(){ strC += 'C'; strCI += 'X'; });
  note._trigger('change');
  ok( strC == "C", "should run handlers bound to Class if any");

  Note.bind('change',function(){ strC += 'A'; strCI += 'Y'; });
  note._trigger('change');
  ok( strC == "CCA", "should run handlers bound to Class in the order they were bound if there are more than one");

  note.bind('change',function(){ strI += 'B'; strCI += 'Z'; });
  note._trigger('change');
  ok( strI == "B", "should run handlers bound to instance if any");

  note.bind('change',function(){ strI += 'E'; strCI += '0'; });
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

test("instance.isValid",function(){
  ok( Note.prototype.__lookupGetter__('isValid'), 'isValid getter exists on Class');
});

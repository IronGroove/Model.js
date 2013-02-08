module("Instance creation", {
  setup:function () {
    Note = new Model('Note', function () {
      this.attr('id!', 'number');
      this.attr('title', 'string');
    });
  },
  teardown:function () {
    delete Note;
    delete Model._classes.Note;
  }
});

test("should be created with `new` keyword",
function () {
  throws(function () { var note = Note(); }, /C001/, 'throws exception without `new`' );

  var note;

  note = new Note();
  ok( true, 'passes with `new`');

  note = new Note;
  ok( true, 'passes when provided nothing');

  deepEqual( note._callbacks, {}, "has _callbacks object upon creation");
});

test("should fail if Class constructor is passed 1 argument and it is neither a boolean, nor a data object",
function () {
  throws(function () { var note = new Note('abc'); },     /C002/, 'string' );
  throws(function () { var note = new Note(12345); },     /C002/, 'number' );
  throws(function () { var note = new Note([]); },        /C002/, 'array' );
  throws(function () { var note = new Note(null);  },     /C002/, 'null' );
  throws(function () { var note = new Note(undefined); }, /C002/, 'explicit undefined' );
  throws(function () { var note = new Note(/re/);  },     /C002/, 'regexp' );

  var note = new Note(false);
  ok( true, 'passes when receives false');

  var note = new Note({});
  ok( true, 'passes when receives a plain object');
});

test("should fail if receives 2 arguments and they are not a boolean with a plain object data",
function () {
  throws(function () { var note = new Note('abc', {}); },     /C003/, 'fails if first argument is not boolean' );
  throws(function () { var note = new Note(true, 'abc'); },   /C003/, 'fails if second argument is not a plain object' );

  var note = new Note(false, {});
  ok( true, 'passes when 1st arg is boolean and second is plain object');
});

test("should fail if given more than 2 arguments",
function () {
  throws(function () { var note = new Note(true, { title: "String" }, 1); }, /C004/, 'fails when 2 first arguments are correct and provided any 3rd argument' );
});

test("should fail if explicit persistance flag is true and no idAttr value is provided in data obj",
function () {
  throws(function () { var note = new Note(true, { title: 'abc'}); }, /C005/);
  throws(function () { var note = new Note(true); },                  /C005/);
  throws(function () { var note = new Note(true, {}); },              /C005/);

  var note = new Note(true, { id: 1212 });
  ok( true );
});

test("instance._data should become populated with data provided on creation",
function () {
  var note = new Note;
  ok( note.hasOwnProperty('_data'), 'instance gets own property _data created along with instance');
  ok( $.isPlainObject(note._data), 'instance._data is plain object');

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




module("instance.isPersisted & instance.persist()", {
  teardown:function () {
    Model._classes = {};
  }
});

test("when idAttr is set",
function () {
  var note, Note = new Model('Note', function () {
    this.attr('id!', 'number');
    this.attr('title', 'string');
  });

  ok( Note.prototype.__lookupGetter__('isPersisted'), 'isPersisted getter exists on Class');


  note = new Note;
  ok( !note.isPersisted );

  note = new Note({});
  ok( !note.isPersisted );

  note = new Note({ id: 1212 });
  ok( note.isPersisted );

  note = new Note({ title: "Some" });
  ok( !note.isPersisted );


  note = new Note(false);
  ok( !note.isPersisted );

  note = new Note(false, {});
  ok( !note.isPersisted );

  // NOTE This instance is considered new, as if it should be created with a known id.
  note = new Note(false, { id: 1212 });
  ok( !note.isPersisted );

  note = new Note(false, { title: "Some" });
  ok( !note.isPersisted );


  throws(function () {
    note = new Note(true);
    note.isPersisted;
  }, /C005/);

  throws(function () {
    note = new Note(true, {});
    note.isPersisted;
  }, /C005/);

  throws(function () {
    note = new Note(true, { title: "Some" });
    note.isPersisted;
  }, /C005/);

  note = new Note(true, { id: 1212 });
  ok( note.isPersisted );



  var persisted = 0;
  note.bind('persist', function () {
    persisted += 1;
  });

  note.data.title = "New";
  ok( !note.isPersisted );
  note._persist();
  ok( persisted == 1, "persist event should be triggered" );
  ok( note.isPersisted, "instance should become persisted after _perstst method call" );

  note._persist();
  ok( persisted == 1, "persist event should not be triggered if there were no changes" );
  ok( note.isPersisted, "instance should stay persisted in that case too" );
});

test("when no idAttr is set",
function () {
  var note, Note = new Model('Note', function () {
    this.attr('slug', 'string');
    this.attr('title', 'string');
  });


  throws(function () {
    note = new Note;
    note.isPersisted;
  }, /C006/);

  throws(function () {
    note = new Note({});
    note.isPersisted;
  }, /C006/);

  note = new Note({ title: "Some" });
  ok( note.isPersisted );


  note = new Note(false);
  ok( !note.isPersisted );

  note = new Note(false, {});
  ok( !note.isPersisted );

  note = new Note(false, { title: "Some" });
  ok( !note.isPersisted );

  throws(function () {
    note = new Note(true);
    note.isPersisted;
  }, /C006/);

  throws(function () {
    note = new Note(true, {});
    note.isPersisted;
  }, /C006/);

  note = new Note(true, { title: "Some" });
  ok( note.isPersisted );


  var persisted = 0;
  note.bind('persist', function () { persisted += 1; });

  note.data.title = "New";
  ok( !note.isPersisted );
  note._persist();
  ok( persisted == 1, "persist event should be triggered" );
  ok( note.isPersisted, "instance should become persisted after _perstst method call" );

  note._persist();
  ok( persisted == 1, "persist event should not be triggered if there were no changes" );
  ok( note.isPersisted, "instance should stay persisted in that case too" );
});

test("after being changed",
function () {
  var note, Note = new Model('Note', function () {
    this.attr('slug', 'string');
    this.attr('title', 'string');
  });

  note = new Note({ slug: "abc", title: "ABC" });
  ok( note.isPersisted );
  note.data.title = "Other";
  ok( !note.isPersisted );
  note.data.title = "ABC";
  ok( note.isPersisted );

  note = new Note(false, { slug: "abc", title: "ABC" });
  ok( !note.isPersisted );
  note.data.title = "Other";
  ok( !note.isPersisted );
  note.data.title = "ABC";
  ok( !note.isPersisted );

  note = new Note(true, { slug: "abc", title: "ABC" });
  ok( note.isPersisted );
  note.data.title = "Other";
  ok( !note.isPersisted );
  note.data.title = "ABC";
  ok( note.isPersisted );
});


// TODO Add other tests ckecking instance.isPersisted after note.persist() and note.revert() method calls.



module("instance.isNew", {
  teardown:function () {
    Model._classes = {};
  }
});

test("when idAttr is set",
function () {
  var note, Note = new Model('Note', function () {
    this.attr('id!', 'number');
    this.attr('title', 'string');
  });

  ok( Note.prototype.__lookupGetter__('isNew'), 'isNew getter exists on Class');


  note = new Note;
  ok( note.isNew );

  note = new Note({});
  ok( note.isNew );

  note = new Note({ id: 1212 });
  ok( !note.isNew );

  note = new Note({ title: "Some" });
  ok( note.isNew );


  note = new Note(false);
  ok( note.isNew );

  note = new Note(false, {});
  ok( note.isNew );

  // NOTE This instance is considered new, as if it should be created with a known id.
  note = new Note(false, { id: 1212 });
  ok( note.isNew );

  note = new Note(false, { title: "Some" });
  ok( note.isNew );


  throws(function () {
    note = new Note(true);
    note.isNew;
  }, /C005/);

  throws(function () {
    note = new Note(true, {});
    note.isNew;
  }, /C005/);

  throws(function () {
    note = new Note(true, { title: "Some" });
    note.isNew;
  }, /C005/);

  note = new Note(true, { id: 1212 });
  ok( !note.isNew );
});

test("when no idAttr is set",
function () {
  var note, Note = new Model('Note', function () {
    this.attr('slug', 'string');
    this.attr('title', 'string');
  });


  throws(function () {
    note = new Note;
    note.isNew;
  }, /C006/);

  throws(function () {
    note = new Note({});
    note.isNew;
  }, /C006/);

  note = new Note({ title: "Some" });
  ok( !note.isNew );


  note = new Note(false);
  ok( note.isNew );

  note = new Note(false, {});
  ok( note.isNew );

  note = new Note(false, { title: "Some" });
  ok( note.isNew );

  throws(function () {
    note = new Note(true);
    note.isNew;
  }, /C006/);

  throws(function () {
    note = new Note(true, {});
    note.isNew;
  }, /C006/);

  note = new Note(true, { title: "Some" });
  ok( !note.isNew );
});

test("after being changed",
function () {
  var note, Note = new Model('Note', function () {
    this.attr('slug', 'string');
    this.attr('title', 'string');
  });

  note = new Note({ slug: "abc", title: "ABC" });
  ok( !note.isNew );
  note.data.title = "Other";
  ok( !note.isNew );
  note.data.title = "ABC";
  ok( !note.isNew );

  note = new Note(false, { slug: "abc", title: "ABC" });
  ok( note.isNew );
  note.data.title = "Other";
  ok( note.isNew );
  note.data.title = "ABC";
  ok( note.isNew );

  note = new Note(true, { slug: "abc", title: "ABC" });
  ok( !note.isNew );
  note.data.title = "Other";
  ok( !note.isNew );
  note.data.title = "ABC";
  ok( !note.isNew );
});







module("Instance", {
  setup: function () {
    Note = new Model('Note', function () {
      this.attr('id!', 'number');
      this.attr('title', 'string');
    });
  },
  teardown:function () {
    delete Note;
    Model._classes = {};
  }
});

test("_get(attrName)",
function () {
  var noteData = { id: 123, title: 'abc' },
    note = new Note(noteData);

  ok( note._data.id === 123 );
  ok( note._data.title === 'abc' );
  ok( note._get('id') === 123 );
  ok( note._get('title') === 'abc' );
});

test("_set(attrName, value, triggerChange)",
function () {
  var noteData = { id: 123, title: 'abc' },
    note = new Note(noteData), change = 0;

  note.bind('change', function () { change += 1; });

  ok( note._set('title', 'new') === true, "_set should return true if new value is set");
  ok( note._data.title === 'new', "value should be changed" );
  ok( change == 1, "change event should be triggered if 3rd argument triggerChange is omitted")
  deepEqual( note._changes, { title: "abc" }, "_changes should be populated by original value for the changed attribute");
  deepEqual( note._changesAfterValidation, { title: "new" }, "_changesAfterValidation should be populated by tha new value for the attribute");

  ok( note._set('title', 'new') === false, "_set should return false if new value is not set");
  ok( note._data.title === 'new', "value should not be changed in that case");
  deepEqual( note._changes, { title: "abc" }, "_changes should not have changed in thaat case");
  deepEqual( note._changesAfterValidation, { title: "new" }, "_changesAfterValidation should not have changed also");
  ok( change == 1, "change event should note be triggered in that case")

  note._set('title', 'NEW');
  ok( note._data.title === 'NEW', "should work correctly after _set >> false");
  deepEqual( note._changes, { title: "abc" });
  deepEqual( note._changesAfterValidation, { title: "NEW" });
  ok( change == 2 );

  note._set('title', 'abc');
  ok( note._data.title === 'abc', "should work correclty after _set >> true");
  deepEqual( note._changes, {});
  deepEqual( note._changesAfterValidation, { title: "abc" });
  ok( change == 3 );

  note._set('title', 'Boo', false);
  ok( note._data.title === 'Boo', "should work correctly if 3rd argument triggerChange is false");
  deepEqual( note._changes, { title: "abc" });
  deepEqual( note._changesAfterValidation, { title: "Boo" });
  ok( change == 3, "but change event should not be triggered in that case");
});


test("data()",
function () {
  var noteData = { id: 123, title: 'abc', text: 'text' },
    note = new Note(noteData);

  ok( note.data(undefined) == note, "data(undefined) should return the instance");

  ok( typeof(note.data) == 'function', "returned should be a function");
  ok( note.data() !== note._data, "returned object shouldn't be a reference to a private _data property");
  ok( note.data() !== noteData, "returned object shouldn't be a reference to data provided to a constructor");

  deepEqual( objectKeys(note.data()), Note.attributeNames, "keys in returned object should be same as Class attributes");
  deepEqual( note.data(), { id: 123, title: 'abc' }, "data() should return a copy of actual data");
  deepEqual( note.data(123), { id: 123, title: 'abc' }, "data([anything other than undefined]) should return a copy of actual data");
});

test("data",
function () {
  var noteData = { id: 123, title: 'abc', text: 'text' },
    note = new Note(noteData);

  var keys = []; for (var k in note.data) keys.push(k);
  deepEqual(keys, Note.attributeNames, "data is iterable and contains keys for all declared attributes");
});

test("data.[attrName]",
function () {
  var noteData = { id: 123, title: 'abc', text: 'text' },
    note = new Note(noteData);

  var keys = []; for (var k in note.data) keys.push(k);
  deepEqual(keys, Note.attributeNames, "data is iterable and contain keys for all declared attributes");

  for (var i = 0; i < Note.attributeNames.length; i++) {
    ok( note.data.__lookupGetter__( Note.attributeNames[i] ),  Note.attributeNames[i]+' getter exists' );
    ok( note.data[ Note.attributeNames[i] ] == noteData[ Note.attributeNames[i] ],  Note.attributeNames[i]+' getter value OK' );
  }
});

test("data.[attrName]=",
function () {
  var noteData = { id: 123, title: 'abc', text: 'text' },
    note = new Note(noteData);

  for (var i = 0; i < Note.attributeNames.length; i++) {
    ok( note.data.__lookupSetter__( Note.attributeNames[i] ),  Note.attributeNames[i]+'= setter exists' );
    var rand = Math.random() * 99;
    note.data[ Note.attributeNames[i] ] = rand;
    ok( note._data[ Note.attributeNames[i] ] === rand,  Note.attributeNames[i]+'= setter works' );
  }
});

test("data=",
function () {
  var noteData = { id: 123, title: 'abc', text: 'text' },
    changes,
    note = new Note(noteData);

  throws(function () { note.data = 1234; },      /I201/, "fails if right-hand is a number");
  throws(function () { note.data = null; },      /I201/, "fails if right-hand is null");
  throws(function () { note.data = undefined; }, /I201/, "fails if right-hand is undefined");
  throws(function () { note.data = true; },      /I201/, "fails if right-hand is boolean true");
  throws(function () { note.data = false; },     /I201/, "fails if right-hand is boolean false");
  throws(function () { note.data = $.noop; },    /I201/, "fails if right-hand is a function");
  throws(function () { note.data = 'str'; },     /I201/, "fails if right-hand is a string");
  throws(function () { note.data = []; },        /I201/, "fails if right-hand is an array");

  var data1 = { id: 123, title: 'ABC' };
  var data2 = { id: 456, title: 'abc' };
  var data3 = { id: 567, title: 'Abc' };
  var data4 = { id: 567, title: 'abc', text: 'Text' };

  note.bind('change', function (chngs) { changes = $.extend(changes, {}, chngs); });

  note.data = data1;
  deepEqual( note.data(), data1 );
  ok( note.data() !== data1 );
  ok( note._data !== data1 );
  deepEqual( changes, { title: "ABC" }, "should trigger change event");

  note.data = data2;
  deepEqual( note.data(), data2 );
  ok( note.data() !== data2 );
  ok( note._data !== data2 );

  note.data = data3;
  deepEqual( note.data(), data3 );
  ok( note.data() !== data3 );
  ok( note._data !== data3 );

  note.data = data4;
  deepEqual( note.data(), { id: 567, title: 'abc' });
  ok( note._data !== data4 );
});


test("hasChanged",
function () {
  ok( Note.prototype.__lookupGetter__('hasChanged'), 'hasChanged getter exists on Class');

  var note;


  // persistence

  note = new Note({ id: 1212, title: "ABC" });
  ok( !note.hasChanged, "persisting instance should not be changed right after initializing");

  note = new Note(false, { id: 1212, title: "ABC" });
  ok( !note.hasChanged, "non persisting instance should not be changed right after initializing");

  note = new Note(true, { id: 1212, title: "ABC" });
  ok( !note.hasChanged, "persisting instance should not be changed right after initializing 2");

  note = new Note({ title: "ABC" });
  ok( !note.hasChanged, "not persisting instance should not be changed right after initializing");

  note = new Note(false, { title: "ABC" });
  ok( !note.hasChanged, "not persisting instance should not be changed right after initializing");


  // data.[attrName]= setter

  note = new Note({ id: 1212, title: "ABC" });

  note.data.title = "NEW";
  ok( note.hasChanged, "instance should be changed after changing any attribute value via data.[attrName]=");

  note.data.title = "ABC";
  ok( !note.hasChanged, "instance should not be changed when old value is explicitly changed to the initial one via data.[attrName]=");


  // data= setter

  note = new Note({ id: 1212, title: "ABC" });

  note.data = { id: 1313, title: "ABC"};
  ok( note.hasChanged, "instance should be changed after changing data via data=");

  note.data = { id: 1212, title: "ABC"};
  ok( !note.hasChanged, "instance should not be changed when old values are explicitly changed to the initial ones via data=");


  // set

  note = new Note({ id: 1212, title: "ABC" });

  note.set('title', "NEW");
  ok( note.hasChanged, "instance should be changed after changing data via set");

});

// TODO Add other tests ckecking instance.isPersisted after note.persist() and note.revert() method calls.


test("_changes should reflect currently changed attributes and their persisted values",
function () {
  var note = new Note({ id: 1212, title: "ABC" });

  deepEqual( note._changes, {});

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


test("get(), get(attrName)",
function () {
  var noteData = { id: 123, title: 'abc' },
    note = new Note(noteData);

  throws(function () { note.get(null, 1, 2); }, /I202/, "fails when any of provided attribute names is not a string");

  var ret = note.get();
  ok( $.isPlainObject(ret), "should return data object if no argument passed");
  ok( objectSize(ret) === 2, "returned data object should have as many keys as there are attributes in the model");
  deepEqual( ret, note._data, "returned data object should have key-value pairs mirroring real attribute names and corresponding values");
  ok( ret !== noteData, "returned data object should not be (by referecence) exactly that object passed to instance constructor");
  ok( ret !== note._data, "returned data object should not be (by referecence) obj._data");

  ok( note.get('title') === 'abc', "should return single value when one attribute name is passed");
  throws(function () { note.get('slug'); }, /I202/, "fails when any of provided attribute names is unknown");

  var ret = note.get('id', 'title');
  ok( $.isPlainObject(ret), "should return data object if more than one attribute name is passed");
  ok( objectSize(ret) == 2, "returned data object should have exactly same number of keys as number of attibute arguments passed");
  ok( ret.id === 123 && ret.title === 'abc', "returned object should have key-value pairs mirroring real attribute names and corresponding values");
});

test("set(attrName, value)",
function () {
  var noteData = { id: 123, title: 'abc', text: 'text' },
    note = new Note(noteData), change;

  throws(function () { note.set(); }, /I203/, "should fail if no arguments provided");
  throws(function () { note.set('title'); }, /I203/, "should fail if only attribute name provided");
  throws(function () { note.set('slug', 123); }, /I203/, "should fail if attribute name provided is invalid");
  ok( note.set('title', 'boom') === undefined, "should return undefined");
  ok( note._data.title == 'boom', "should change the value returned afterwards by the get method");

  note.bind('change', function () { change = true; });
  note.set('title', 'New');
  ok( note._data.title == 'New' );
  ok( change === undefined, "should not trigger change event" );
});

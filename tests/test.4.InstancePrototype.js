module("InstancePrototype", {
  teardown:function () {
    Model._classes = {};
  }
});

test("consistency",
function () {
  var InstancePrototype = Model.private.InstancePrototype;
  ok( InstancePrototype.__lookupGetter__('isPersisted') );
  ok( $.isFunction(InstancePrototype._persist) );
  ok( InstancePrototype.__lookupGetter__('data') );
  ok( InstancePrototype.__lookupSetter__('data') );
  ok( InstancePrototype.__lookupGetter__('isNew') );
  ok( InstancePrototype.__lookupGetter__('hasChanged') );
  ok( InstancePrototype.__lookupGetter__('_hasChangedAfterValidation') );
  ok( InstancePrototype.__lookupGetter__('errors') );
  ok( InstancePrototype.__lookupGetter__('isValid') );
  ok( $.isFunction(InstancePrototype.get) );
  ok( $.isFunction(InstancePrototype.set) );
  ok( $.isFunction(InstancePrototype._get) );
  ok( $.isFunction(InstancePrototype._set) );
  ok( $.isFunction(InstancePrototype.bind) );
  ok( $.isFunction(InstancePrototype._trigger) );
});

test("isPersisted — idAttr is set on Class",
function () {
  var note, Note = new Model('Note', function () {
    this.attr('id!', 'number');
    this.attr('title', 'string');
  });

  note = new Note;                           ok( !note.isPersisted );
  note = new Note({});                       ok( !note.isPersisted );
  note = new Note({ id: 1212 });             ok(  note.isPersisted );
  note = new Note({ title: "Some" });        ok( !note.isPersisted );
  note = new Note(false);                    ok( !note.isPersisted );
  note = new Note(false, {});                ok( !note.isPersisted );
  note = new Note(false, { id: 1212 });      ok( !note.isPersisted );
  note = new Note(false, { title: "Some" }); ok( !note.isPersisted );
  note = new Note(true, { id: 1212 });       ok(  note.isPersisted );
});

test("isPersisted — no idAttr on Class",
function () {
  var note, Note = new Model('Note', function () {
    this.attr('slug', 'string');
    this.attr('title', 'string');
  });

  note = new Note({ title: "Some" });        ok(  note.isPersisted );
  note = new Note(false);                    ok( !note.isPersisted );
  note = new Note(false, {});                ok( !note.isPersisted );
  note = new Note(false, { title: "Some" }); ok( !note.isPersisted );
  note = new Note(true, { title: "Some" });  ok(  note.isPersisted );


  // After being changed.

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


test("_persist() — idAttr is set on Class",
function () {
  var note, Note = new Model('Note', function () {
    this.attr('id!', 'number');
    this.attr('title', 'string');
  });

  note = new Note(true, { id: 1212 }); ok(  note.isPersisted );

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

test("_persist() — no idAttr on Class",
function () {
  var note, Note = new Model('Note', function () {
    this.attr('slug', 'string');
    this.attr('title', 'string');
  });

  note = new Note(true, { title: "Some" });  ok(  note.isPersisted );

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

test("isNew — idAttr is set on Class",
function () {
  var note, Note = new Model('Note', function () {
    this.attr('id!', 'number');
    this.attr('title', 'string');
  });

  note = new Note;                           ok(  note.isNew );
  note = new Note({});                       ok(  note.isNew );
  note = new Note({ id: 1212 });             ok( !note.isNew );
  note = new Note({ title: "Some" });        ok(  note.isNew );
  note = new Note(false);                    ok(  note.isNew );
  note = new Note(false, {});                ok(  note.isNew );
  note = new Note(false, { id: 1212 });      ok(  note.isNew );
  note = new Note(false, { title: "Some" }); ok(  note.isNew );
  note = new Note(true, { id: 1212 });       ok( !note.isNew );
});

test("isNew — no idAttr on Class",
function () {
  var note, Note = new Model('Note', function () {
    this.attr('slug', 'string');
    this.attr('title', 'string');
  });

  note = new Note({ title: "Some" });        ok( !note.isNew );
  note = new Note(false);                    ok(  note.isNew );
  note = new Note(false, {});                ok(  note.isNew );
  note = new Note(false, { title: "Some" }); ok(  note.isNew );
  note = new Note(true, { title: "Some" });  ok( !note.isNew );


  // After being changed.

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



module("InstancePrototype", {
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

test("data[attrName]",
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

test("data[attrName]=",
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

test("_changes — should reflect currently changed attributes and their persisted values",
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

test("_hasChangedAfterValidation",
function () {
  ok( Note.prototype.__lookupGetter__('_hasChangedAfterValidation'), 'hasChangedAfterValidation getter exists on Class');

  var note = new Note({ id: 1212, title: "ABC" });

  note.data.title = "New";
  ok( note._hasChangedAfterValidation === true );

  note.isValid;
  ok( note._hasChangedAfterValidation === false );

  note.data.id = null;
  ok( note._hasChangedAfterValidation === true );

  note.data.id = undefined;
  ok( note._hasChangedAfterValidation === true );

  note.data.id = 1212;
  ok( note._hasChangedAfterValidation === true );
});

test("_changesAfterValidation should reflect currently changed attributes and their persisted values after the validation has occured",
function () {
  var note = new Note({ id: 1212, title: "ABC" });

  deepEqual( note._changesAfterValidation, true, "new instances should have _hasChangedAfterValidation property equal to true");

  note.data.title = "NEW";
  deepEqual( note._changesAfterValidation, { title: "NEW" });

  note.data.id = 123;
  deepEqual( note._changesAfterValidation, { id: 123, title: "NEW" });

  note.data.id = 1234;
  deepEqual( note._changesAfterValidation, { id: 1234, title: "NEW" });

  note.data.id = 1212;
  deepEqual( note._changesAfterValidation, { id: 1212, title: "NEW" });

  note.data.title = "ABC"
  deepEqual( note._changesAfterValidation, { id: 1212, title: "ABC" });

  note.data = { title: "NEW", id: 1313 };
  deepEqual( note._changesAfterValidation, { id: 1313, title: "NEW" });
  note.errors;
  deepEqual( note._changesAfterValidation, {}, "should be empty after validation (errors)");

  note.data.id = 1234;
  deepEqual( note._changesAfterValidation, { id: 1234 });
  note.isValid;
  deepEqual( note._changesAfterValidation, {}, "should be empty after validation (isValid)");
});

test("errors",
function () {
  ok( Note.prototype.__lookupGetter__('errors'), 'errors getter exists on Class');
  var note = new Note({ id: 1212, title: "ABC" });

  note.data.id = null;
  deepEqual( note.errors, { id: Model.errCodes.NULL });

  note.data.title = new Date;
  deepEqual( note.errors, { id: Model.errCodes.NULL, title: Model.errCodes.WRONG_TYPE });

  note.data = { id: 12, title: "New" };
  deepEqual( note.errors, {});

  note.data.id = 'string';
  deepEqual( note.errors, { id: Model.errCodes.WRONG_TYPE });

  Note.validate = function () { return "Yeah!"; }
  deepEqual( note.errors, { id: Model.errCodes.WRONG_TYPE },
    "should return last result if no changes where made to instance data");

  note.data.id = 'just-for-changing-after-validation';
  ok( note.errors == 'Yeah!', "should return the result of Class.validate function call");
});

test("isValid",
function () {
  ok( Note.prototype.__lookupGetter__('isValid'), 'isValid getter exists on Class');

  var note = new Note({ id: 1212, title: "ABC" });

  note.data.id = null;
  ok( note.isValid == false );

  note.data.title = new Date;
  ok( note.isValid == false );

  note.data = { id: 12, title: "New" };
  ok( note.isValid == true );

  note.data.id = 'string';
  ok( note.isValid == false );
});


test("bind(eventName, handler)",
function () {
  var note = new Note({ id: 123, title: 'abc' }),
    noop1 = new Function,
    noop2 = new Function,
    noop3 = new Function;

  throws(function () { note.bind(); },                    /I204/, "should fail if no arguments specified!");
  throws(function () { note.bind(true); },                /I204/, "should fail if first argument is boolean true!");
  throws(function () { note.bind(false); },               /I204/, "should fail if first argument is boolean false!");
  throws(function () { note.bind(undefined); },           /I204/, "should fail if first argument is undefined!");
  throws(function () { note.bind(1234); },                /I204/, "should fail if first argument is an number!");
  throws(function () { note.bind(null); },                /I204/, "should fail if first argument is null!");
  throws(function () { note.bind([]); },                  /I204/, "should fail if first argument is an array!");
  throws(function () { note.bind({}); },                  /I204/, "should fail if first argument is an object!");
  throws(function () { note.bind(/re/); },                /I204/, "should fail if first argument is a regexp!");
  throws(function () { note.bind($.noop); },              /I204/, "should fail if first argument is a function!");
  throws(function () { note.bind('string'); },            /I204/, "should fail if first argument is an unknown name!");
  throws(function () { note.bind('str', $.noop); },       /I204/, "should fail if first argument is an unknown name though 2nd is a function!");

  throws(function () { note.bind('change'); },            /I204/, "should fail if second argument is omitted");
  throws(function () { note.bind('change', true); },      /I204/, "should fail if second argument is not a function (true boolean supplied)");
  throws(function () { note.bind('change', false); },     /I204/, "should fail if second argument is not a function (false boolean supplied)");
  throws(function () { note.bind('change', undefined); }, /I204/, "should fail if second argument is not a function (undefined supplied)");
  throws(function () { note.bind('change', 1234); },      /I204/, "should fail if second argument is not a function (number supplied)");
  throws(function () { note.bind('change', null); },      /I204/, "should fail if second argument is not a function (null supplied)");
  throws(function () { note.bind('change', []); },        /I204/, "should fail if second argument is not a function (array supplied)");
  throws(function () { note.bind('change', {}); },        /I204/, "should fail if second argument is not a function (object supplied)");
  throws(function () { note.bind('change', 'str'); },     /I204/, "should fail if second argument is not a function (string supplied)");
  throws(function () { note.bind('change', /re/); },      /I204/, "should fail if second argument is not a function (regexp supplied)");

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

test("_trigger(eventName)",
function () {
  // Abbreviations assume Class & Instance.
  var strC = '', strI = '', strCI = '',
    note = new Note({ id: 123, title: "ABC" });

  // should fail unless 1st argument is not a string name of a known event
  throws(function () { note._trigger(); },          /I205/, "should fail if no arguments specified");
  throws(function () { note._trigger(true); },      /I205/, "should fail if first argument is boolean true");
  throws(function () { note._trigger(false); },     /I205/, "should fail if first argument is boolean false");
  throws(function () { note._trigger(undefined); }, /I205/, "should fail if first argument is undefined");
  throws(function () { note._trigger(1234); },      /I205/, "should fail if first argument is an number");
  throws(function () { note._trigger(null); },      /I205/, "should fail if first argument is null");
  throws(function () { note._trigger([]); },        /I205/, "should fail if first argument is an array");
  throws(function () { note._trigger({}); },        /I205/, "should fail if first argument is an object");
  throws(function () { note._trigger(/re/); },      /I205/, "should fail if first argument is a regexp");
  throws(function () { note._trigger($.noop); },    /I205/, "should fail if first argument is a function");
  throws(function () { note._trigger('string'); },  /I205/, "should fail if first argument is an unknown name");

  note._trigger('change');
  ok (true, "should pass (should do nothing if a known event is triggered though no handlers were previousy bound)");

  Note.bind('change',function () { strC += 'C'; strCI += 'X'; });
  note._trigger('change');
  ok( strC == "C", "should run handlers bound to Class if any");

  Note.bind('change',function () { strC += 'A'; strCI += 'Y'; });
  note._trigger('change');
  ok( strC == "CCA", "should run handlers bound to Class in the order they were bound if there are more than one");

  note.bind('change',function () { strI += 'B'; strCI += 'Z'; });
  note._trigger('change');
  ok( strI == "B", "should run handlers bound to instance if any");

  note.bind('change',function () { strI += 'E'; strCI += '0'; });
  note._trigger('change');
  ok( strI == "BBE", "should run handlers bound to instance in the order theu were bound if there are more than one");

  ok( strCI == "XXYXYZXYZ0", "should run handlers bound to Class before handlers bound to an instance");

  var result = '';
  note.bind('change', function (changes, bing) {
    result += changes.id;
    result += this.data.title;
    result += bing;
  });
  note._trigger('change', { id: 23 }, 'boo!');

  ok( result == '23ABCboo!', "handler function should receive instance as a context and pass arguments received to the handler");
});

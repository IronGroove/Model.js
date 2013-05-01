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


//   C H A N G E S  ,  G E T T E R S   &   S E T T E R S
//   ===================================================

test("isNew",
function () {
  var note = new Note;

  note._persisted = 0;
  ok( note.isNew );

  note._persisted = 1;
  ok( !note.isNew );
});

test("isPersisted",
function () {
  var note = new Note;

  note._persisted = false;
  note.__defineGetter__('hasChanged', function () { return true; });
  ok( !note.isPersisted );

  note._persisted = false;
  note.__defineGetter__('hasChanged', function () { return false; });
  ok( !note.isPersisted );

  note._persisted = true;
  note.__defineGetter__('hasChanged', function () { return true; });
  ok( !note.isPersisted );

  note._persisted = true;
  note.__defineGetter__('hasChanged', function () { return false; });
  ok( note.isPersisted );
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
    note = new Note(noteData),
    change = 0;

  note._trigger = function (eventName) { if (eventName == 'change') change += 1; };

  ok( note._set('title', 'new') === true, "_set should return true if new value is set");
  ok( note._data.title === 'new', "value should be changed" );
  ok( change == 1, "change event should be triggered if 3rd argument triggerChange is omitted")
  deepEqual( note._changes, { title: "abc" }, "_changes should be populated by original value for the changed attribute");
  deepEqual( note._changesAfterValidation, { title: "new" }, "_changesAfterValidation should be populated by the new value for the attribute");

  ok( note._set('title', 'new') === false, "_set should return false if new value is not set");
  ok( note._data.title === 'new', "value should not be changed in that case");
  deepEqual( note._changes, { title: "abc" }, "_changes should not have changed in thaat case");
  deepEqual( note._changesAfterValidation, { title: "new" }, "_changesAfterValidation should not have changed also");
  ok( change == 1, "change event should not be triggered in that case")

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

  note._set('id', 1, false);
  deepEqual( note._changes, { title: "abc", id: 123 });
  deepEqual( note._changesAfterValidation, { title: "Boo", id: 1 });
});

test("data",
function () {
  var noteData = { id: 123, title: 'abc', text: 'text' },
    note = new Note(noteData);

  note._data2 = 123;
  ok( note.data == 123, "should return _data2 whatever it is");

  note = new Note(noteData);

  var keys = objectKeys(note.data);
  deepEqual(keys, Note.attributeNames, "data is iterable and contains keys for all declared attributes");
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

  note._trigger = function (eventName, chngs) { if (eventName == 'change') changes = $.extend(changes, {}, chngs); };

  note.data = data1;
  deepEqual( note._data, data1 );
  ok( note._data !== data1 );
  deepEqual( changes, { title: "ABC" }, "should trigger change event with changes object passed to it");

  note.data = data2;
  deepEqual( note._data, data2 );
  ok( note._data !== data2 );

  note.data = data3;
  deepEqual( note._data, data3 );
  ok( note._data !== data3 );

  note.data = data4;
  deepEqual( note._data, { id: 567, title: 'abc' });
});

test("hasChanged",
function () {
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


  // data[attrName]= setter

  note = new Note({ id: 1212, title: "ABC" });

  note.data.title = "ABC";
  ok( !note.hasChanged, "instance should not be changed after resetting initial attribute value via data[attrName]=");

  note.data.title = "NEW";
  ok( note.hasChanged, "instance should be changed after changing any attribute value via data[attrName]=");

  note.data.title = "ABC";
  ok( !note.hasChanged, "instance should not be changed when old value is explicitly changed to the initial one via data[attrName]=");


  // data= setter

  note = new Note({ id: 1212, title: "ABC" });

  note.data = { id: 1212, title: "ABC"};
  ok( !note.hasChanged, "instance should not be changed after reseting same initial data via data=");

  note.data = { id: 1313, title: "ABC"};
  ok( note.hasChanged, "instance should be changed after changing data via data=");

  note.data = { id: 1212, title: "ABC"};
  ok( !note.hasChanged, "instance should not be changed when old values are explicitly changed to the initial ones via data=");


  // set

  note = new Note({ id: 1212, title: "ABC" });

  note.set('title', "ABC");
  ok( !note.hasChanged, "instance should not be changed after resetting initial values via set");

  note.set('title', "NEW");
  ok( note.hasChanged, "instance should be changed after changing data via set");


  // general case
  note = new Note;

  note._changes.abc = 123;
  ok( note.hasChanged, "instance should be changed if _changes object has any values in it" );

  note._changes = {}
  ok( !note.hasChanged, "instance should not be changed if _changes object has no values in it" );
});

test("get()",
function () {
  var noteData = { id: 123, title: 'abc' },
    note = new Note(noteData);

  var ret = note.get();
  ok( $.isPlainObject(ret), "should return data object if no argument passed");
  ok( objectSize(ret) === 2, "returned data object should have as many keys as there are attributes in the model");
  deepEqual( ret, note._data, "returned data object should have key-value pairs mirroring real attribute names and corresponding values");
  ok( ret !== noteData, "returned data object should not be (by referecence) exactly that object passed to instance constructor");
  ok( ret !== note._data, "returned data object should not be (by referecence) obj._data");
});

test("get(attrName[, attrName2])",
function () {
  var noteData = { id: 123, title: 'abc' },
    note = new Note(noteData);

  deepEqual( note.get('id', 'title'), { id: 123, title: 'abc' }, "should return data object with values for all valid attribute names passed");
  deepEqual( note.get('id', 'title', 'slug', 1), { id: 123, title: 'abc' }, "should return data object with values for all valid attribute names passed 2");
  deepEqual( note.get(null, 1, 2), {}, "should return empty object if none of provided attribute names is valid");
  deepEqual( note.get('title'), { title: 'abc' }, "should return data object with requested value when one attribute name is passed");

  deepEqual( note.get(['id', 'title']), { id: 123, title: 'abc' }, "should return data object with values for all valid attribute names passed (attribute names passed in array)");
  deepEqual( note.get(['id', 'title', 'slug', 1]), { id: 123, title: 'abc' }, "should return data object with values for all valid attribute names passed (attribute names passed in array) 2");
  deepEqual( note.get([null, 1, 2]), {}, "should return empty object if none of provided attribute names is valid (attribute names passed in array)");
  deepEqual( note.get(['title']), { title: 'abc' }, "should return data object with requested value when one attribute name is passed in array");
});

test("set(attrName, value)",
function () {
  var noteData = { id: 123, title: 'abc', text: 'text' },
    note = new Note(noteData),
    change,
    data = $.extend({}, note._data);

  note.set();
  deepEqual( note._data, data, "should change nothing if no arguments provided");

  note.set('title');
  deepEqual( note._data, data, "should change nothing if 1 arg provided and it is not a data object");

  note.set('slug', 123);
  deepEqual( note._data, data, "should change nothing if 2 args provided but 1st one is an invalid attribute name");

  note.set(1, 123);
  deepEqual( note._data, data, "should change nothing if 2 args provided but 1st one is not even a string");

  ok( note.set('title', 'boom') === undefined, "should return undefined");
  ok( note._data.title == 'boom', "should change the value on attribute");

  note._trigger = function () { change = 1; }
  note.set('title', 'New');
  ok( note._data.title == 'New' );
  ok( change === undefined, "should not trigger change event" );
});

test("set(dataObject)",
function () {
  var noteData = { id: 123, title: 'abc', text: 'text' },
    note = new Note(noteData),
    change,
    data = $.extend({}, note._data);

  note.set({ slug: 123 });
  deepEqual( note._data, data, "should change nothing if provided data object contains no valid attribute names");

  note.set({ slug: 123, title: "QWERTY" });
  notDeepEqual( note._data, data, "should do nothing if provided data object contains no valid attribute names");
  ok( note._data.title == 'QWERTY' && objectSize(note._data) == 2, "should  values on attributes");

  ok( note.set({ 'title': 'boom', id: 2 }) === undefined, "should return undefined");
  ok( note._data.title == 'boom' && note._data.id == 2, "should change values on attributes");

  note._trigger = function () { change = 1; }
  note.set({ id: 1, title: 'New' });
  ok( note._data.id == 1 && note._data.title == 'New' );
  ok( change === undefined, "should not trigger anything" );
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

test("_persist()",
function () {
  var note = new Note({ id: 1212 }),
    eventName;

  note._trigger = function (evtName) { eventName = evtName; };

  // if has changed

  note.data.title = "New";
  ok( note.hasChanged );
  note._persist();

  ok( eventName == 'persist', "persist event should be triggered" );
  ok( note.isPersisted, "instance should become persisted after _perstst method call" );
  deepEqual( note._changes, {}, "_changes should become empty");
  deepEqual( note._changesAfterValidation, {}, "_changesAfterValidation should become empty");

  // if not has changed

  eventName = null;
  ok( !note.hasChanged );
  note._persist();

  ok( !eventName, "nothing should be triggered if instance has not changed" );
  ok( note.isPersisted, "and instance should be persisted anyway after _perstst method call" );
  deepEqual( note._changes, {}, "and _changes should stay empty");
  deepEqual( note._changesAfterValidation, {}, "and _changesAfterValidation should stay empty");
});

test("revert()",
function () {
  var note = new Note({ id: 1212 }),
    eventName;

  note._trigger = function (evtName) { eventName = evtName; };


  // if has changed

  note.data.title = "New";
  ok( note.hasChanged );
  note.revert();

  ok( eventName == 'revert', "revert event should be triggered" );
  ok( note.isPersisted, "instance should become persisted after revert method call" );
  deepEqual( note._changes, {}, "_changes should become empty");
  deepEqual( note._changesAfterValidation, {}, "_changesAfterValidation should become empty");


  // if not has changed

  eventName = null;
  ok( !note.hasChanged );
  note.revert();

  ok( !eventName, "nothing should be triggered if instance has not changed" );
  ok( note.isPersisted, "and instance should be persisted anyway after revert method call" );
  deepEqual( note._changes, {}, "and _changes should stay empty");
  deepEqual( note._changesAfterValidation, {}, "and _changesAfterValidation should stay empty");
});



//   E V E N T S
//   ===========

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

  note._callbacks.change = [];
  note._callbacks.change.push(function () { strC += 'C'; strCI += 'X'; });
  note._trigger('change');
  ok( strC == "C", "should run handlers bound to Class if any");

  note._callbacks.change.push(function () { strC += 'A'; strCI += 'Y'; });
  note._trigger('change');
  ok( strC == "CCA", "should run handlers bound to Class in the order they were bound if there are more than one");

  note._callbacks.change.push(function () { strI += 'B'; strCI += 'Z'; });
  note._trigger('change');
  ok( strI == "B", "should run handlers bound to instance if any");

  note._callbacks.change.push(function () { strI += 'E'; strCI += '0'; });
  note._trigger('change');
  ok( strI == "BBE", "should run handlers bound to instance in the order theu were bound if there are more than one");

  ok( strCI == "XXYXYZXYZ0", "should run handlers bound to Class before handlers bound to an instance");

  var result = '';
  note._callbacks.change.push(function (changes, bing, bong) {
    result += changes.id;
    result += this.data.title;
    result += bing;
    result += bong;
  });
  note._trigger('change', { id: 23 }, 'boo!', 'moo?');

  ok( result == '23ABCboo!moo?', "handler function should receive instance as a context and pass arguments received to the handler");
});



//   V A L I D A T I O N
//   ===================

test("_hasChangedAfterValidation",
function () {
  var note = new Note({ id: 1212, title: "ABC" });

  note._changesAfterValidation = true;
  ok( note._hasChangedAfterValidation === true, "should return be true if _hasChangedAfterValidation is true also" );

  note._changesAfterValidation = {};
  ok( note._hasChangedAfterValidation === false, "should return false if _hasChangedAfterValidation is empty data object" );

  note._changesAfterValidation = { abc: 123 };
  ok( note._hasChangedAfterValidation === true, "should return false if _hasChangedAfterValidation data object is not empty" );
});

test("errors",
function () {
  var note = new Note({ id: 1212, title: "ABC" }),
    validateCalled = false,
    hasChangedCalled = false,
    hasChanged = false,
    realHasChangedAfterValidation = note.__lookupGetter__('_hasChangedAfterValidation'),
    realValidate = Note.validate;

  Note.validate = function () {
    validateCalled = true;
    return realValidate.apply(Note, arguments);
  }

  note.__defineGetter__('_hasChangedAfterValidation', function () {
    hasChangedCalled = true;
    hasChanged = realHasChangedAfterValidation.apply(this);
    return hasChanged;
  });

  note.data.id = null;

  var errors = note.errors;
  ok( hasChangedCalled, "should call _hasChangedAfterValidation method");
  ok( validateCalled, "should call validate method of own constructor");
  deepEqual( errors, { id: Model.errCodes.NULL }, "should return real errors from validation");
  ok( errors == note._errors, "should return _errors object" );
  deepEqual( note._changesAfterValidation, {}, "should empty _changesAfterValidation object" );


  validateCalled = false;
  hasChangedCalled = false;
  hasChanged = false;

  var errors = note.errors;
  ok( hasChangedCalled, "should call _hasChangedAfterValidation method");
  ok( !hasChanged && !validateCalled, "should not call validate method if instance has not changed after previous validation");
  deepEqual( errors, { id: Model.errCodes.NULL }, "but should still return real errors from validation");
  ok( errors, note._errors, "and should return _errors object" );
  deepEqual( note._changesAfterValidation, {}, "and _changesAfterValidation object should be empty" );
});

test("isValid",
function () {
  var note = new Note({ id: 1212, title: "ABC" });

  note._errors = {};
  ok( note.isValid, "should return true if there are no errors" );

  note._errors = { abc: 123 };
  ok( !note.isValid, "should return false if there is any error" );
});

module("Class attributes and methods", {
  setup: function () {
    Note = new Model('Note', function () {
      this.attr('id', 'number', true);
      this.attr('title', 'string');
    });
  },
  teardown: function () {
    delete Note;
    delete Model._classes.Note;
  }
});

test("General presence check", function () {
  deepEqual( Note._callbacks, {} );
});

test("Class.bind", function () {
  var noop1 = new Function,
    noop2 = new Function,
    noop3 = new Function;

  throws(function(){ Note.bind(); },                    /C101/, "should fail if no arguments specified!");
  throws(function(){ Note.bind(true); },                /C101/, "should fail if first argument is boolean true!");
  throws(function(){ Note.bind(false); },               /C101/, "should fail if first argument is boolean false!");
  throws(function(){ Note.bind(undefined); },           /C101/, "should fail if first argument is undefined!");
  throws(function(){ Note.bind(1234); },                /C101/, "should fail if first argument is an number!");
  throws(function(){ Note.bind(null); },                /C101/, "should fail if first argument is null!");
  throws(function(){ Note.bind([]); },                  /C101/, "should fail if first argument is an array!");
  throws(function(){ Note.bind({}); },                  /C101/, "should fail if first argument is an object!");
  throws(function(){ Note.bind(/re/); },                /C101/, "should fail if first argument is a regexp!");
  throws(function(){ Note.bind($.noop); },              /C101/, "should fail if first argument is a function!");
  throws(function(){ Note.bind('string'); },            /C101/, "should fail if first argument is an unknown name!");
  throws(function(){ Note.bind('str', $.noop); },       /C101/, "should fail if first argument is an unknown name though 2nd is a function!");

  throws(function(){ Note.bind('change'); },            /C101/, "should fail if second argument is omitted");
  throws(function(){ Note.bind('change', true); },      /C101/, "should fail if second argument is not a function (true boolean supplied)");
  throws(function(){ Note.bind('change', false); },     /C101/, "should fail if second argument is not a function (false boolean supplied)");
  throws(function(){ Note.bind('change', undefined); }, /C101/, "should fail if second argument is not a function (undefined supplied)");
  throws(function(){ Note.bind('change', 1234); },      /C101/, "should fail if second argument is not a function (number supplied)");
  throws(function(){ Note.bind('change', null); },      /C101/, "should fail if second argument is not a function (null supplied)");
  throws(function(){ Note.bind('change', []); },        /C101/, "should fail if second argument is not a function (array supplied)");
  throws(function(){ Note.bind('change', {}); },        /C101/, "should fail if second argument is not a function (object supplied)");
  throws(function(){ Note.bind('change', 'str'); },     /C101/, "should fail if second argument is not a function (string supplied)");
  throws(function(){ Note.bind('change', /re/); },      /C101/, "should fail if second argument is not a function (regexp supplied)");

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

test("Class.registerValidator", function () {

});

test("Class.validate", function () {
  // should fail unless 1 argument provided and that argument is an instance of self
  // should return object with attribute error arrays agains attribute names, also instance errors again `_instance` attribute
});

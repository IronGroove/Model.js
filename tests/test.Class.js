module("Class.bind", {
  setup: function () {
    Cls = new Class($.noop);
  },
  teardown: function () {
    delete Cls;
  }
});


test("should accept 2 arguments: a valid string eventName and a function eventHandler",
function () {
  throws(function(){ Cls.bind(); },                    /C101/, "should fail if no arguments specified!");
  throws(function(){ Cls.bind(true); },                /C101/, "should fail if first argument is boolean true!");
  throws(function(){ Cls.bind(false); },               /C101/, "should fail if first argument is boolean false!");
  throws(function(){ Cls.bind(undefined); },           /C101/, "should fail if first argument is undefined!");
  throws(function(){ Cls.bind(1234); },                /C101/, "should fail if first argument is an number!");
  throws(function(){ Cls.bind(null); },                /C101/, "should fail if first argument is null!");
  throws(function(){ Cls.bind([]); },                  /C101/, "should fail if first argument is an array!");
  throws(function(){ Cls.bind({}); },                  /C101/, "should fail if first argument is an object!");
  throws(function(){ Cls.bind(/re/); },                /C101/, "should fail if first argument is a regexp!");
  throws(function(){ Cls.bind($.noop); },              /C101/, "should fail if first argument is a function!");
  throws(function(){ Cls.bind('string'); },            /C101/, "should fail if first argument is an unknown name!");
  throws(function(){ Cls.bind('str', $.noop); },       /C101/, "should fail if first argument is an unknown name though 2nd is a function!");

  throws(function(){ Cls.bind('change'); },            /C101/, "should fail if second argument is omitted");
  throws(function(){ Cls.bind('change', true); },      /C101/, "should fail if second argument is not a function (true boolean supplied)");
  throws(function(){ Cls.bind('change', false); },     /C101/, "should fail if second argument is not a function (false boolean supplied)");
  throws(function(){ Cls.bind('change', undefined); }, /C101/, "should fail if second argument is not a function (undefined supplied)");
  throws(function(){ Cls.bind('change', 1234); },      /C101/, "should fail if second argument is not a function (number supplied)");
  throws(function(){ Cls.bind('change', null); },      /C101/, "should fail if second argument is not a function (null supplied)");
  throws(function(){ Cls.bind('change', []); },        /C101/, "should fail if second argument is not a function (array supplied)");
  throws(function(){ Cls.bind('change', {}); },        /C101/, "should fail if second argument is not a function (object supplied)");
  throws(function(){ Cls.bind('change', 'str'); },     /C101/, "should fail if second argument is not a function (string supplied)");
  throws(function(){ Cls.bind('change', /re/); },      /C101/, "should fail if second argument is not a function (regexp supplied)");

  throws(function(){ Cls.bind('change', $.noop, 0); }, /C101/, "should fail when there are more than 2 arguments supplied");
  throws(function(){ Cls.bind('cry', $.noop); },       /C101/, "should fail when an unknown event is being bound");
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

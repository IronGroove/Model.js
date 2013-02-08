module("Instance events", {
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







module("Instance events", {
  setup: function () {
    Note = new Model('Note', function () {
      this.attr('id!',   'string');
      this.attr('title+', 'string');
      this.attr('lang+',  'string');
    });
  },
  teardown:function () {
    delete Note;
    delete Model._classes.Note;
  }
});

test("initialize",
function () {
  Note.bind('initialize', function () {
    if (!this.data.lang) this.data.lang = 'en';
  });

  var note = new Note({ id: 123, title: "ABC" });
  ok( note.data.lang == 'en' );
});

test("change",
function () {

  var changes = [];

  Note.bind('change', function (change) {
    if (change.title) changes.push('title:'+change.title);
  });

  var note = new Note({ id: 123, title: "ABC" });
  note.data.title = "Some";
  deepEqual( changes, [ 'title:Some' ]);

  note.bind('change', function (change) {
    if (change.id) changes.push('id:'+change.id);
  });

  note.data = { id: 1234, title: "New" };
  deepEqual( changes, [ 'title:Some', 'title:New', 'id:1234' ]);


  note.data = { id: 1234, title: "New" };
  deepEqual( changes, [ 'title:Some', 'title:New', 'id:1234' ], "should not be triggered if data left unchanged");
});

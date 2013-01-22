module("Class creation", {
  teardown: function () {
    Model._classes = {};
  }
});

test("fails without keyword `new`", function () {
  throws(function () { var Note = Model(); }, /M001/ );
});

test("fails unless 1st argument is a string", function () {
  throws(function(){ var Note = new Model(); },         /M002/, 'fails if 1st argument is not specified');
  throws(function(){ var Note = new Model(null); },     /M002/, 'fails if 1st argument is null');
  throws(function(){ var Note = new Model(1234); },     /M002/, 'fails if 1st argument is number');
  throws(function(){ var Note = new Model(true); },     /M002/, 'fails if 1st argument is boolean true');
  throws(function(){ var Note = new Model(false); },    /M002/, 'fails if 1st argument is boolean false');
  throws(function(){ var Note = new Model($.noop); },   /M002/, 'fails if 1st argument is function');
  throws(function(){ var Note = new Model([]); },       /M002/, 'fails if 1st argument is array');
});

test("fails unles()d argument is not a plain object", function () {
  throws(function(){ var Note = new Model('Note'); },           /M004/, 'fails if 2nd argument is not specified');
  throws(function(){ var Note = new Model('Note', null); },     /M004/, 'fails if 2nd argument is null');
  throws(function(){ var Note = new Model('Note', 1234); },     /M004/, 'fails if 2nd argument is number');
  throws(function(){ var Note = new Model('Note', true); },     /M004/, 'fails if 2nd argument is boolean true');
  throws(function(){ var Note = new Model('Note', false); },    /M004/, 'fails if 2nd argument is boolean false');
  throws(function(){ var Note = new Model('Note', $.noop); },   /M004/, 'fails if 2nd argument is function');
  throws(function(){ var Note = new Model('Note', 'string'); }, /M004/, 'fails if 2nd argument is string');
  throws(function(){ var Note = new Model('Note', []); },       /M004/, 'fails if 2nd argument is array');
  throws(function(){ var Note = new Model('Note', {}); },       /M005/, 'passes if 2nd argument is a plain object');
});

test("fails if op()s contain no attributes array", function () {
  throws(function(){ var Note = new Model('Note', {}); },                       /M005/, 'fails if attributes omitted');
  throws(function(){ var Note = new Model('Note', { attributes: null }); },     /M005/, 'fails if attributes is null');
  throws(function(){ var Note = new Model('Note', { attributes: 1234 }); },     /M005/, 'fails if attributes is number');
  throws(function(){ var Note = new Model('Note', { attributes: true }); },     /M005/, 'fails if attributes is boolean true');
  throws(function(){ var Note = new Model('Note', { attributes: false }); },    /M005/, 'fails if attributes is boolean false');
  throws(function(){ var Note = new Model('Note', { attributes: $.noop }); },   /M005/, 'fails if attributes is function');
  throws(function(){ var Note = new Model('Note', { attributes: 'string' }); }, /M005/, 'fails if attributes is string');
  throws(function(){ var Note = new Model('Note', { attributes: {} }); },       /M005/, 'fails if attributes is object');
  throws(function(){ var Note = new Model('Note', { attributes: [] }); },       /M005/, 'fails if attributes array is empty');
});

test("fails if at()st one options attributes array element is not a valid attribute notation string", function () {
  throws(function(){ var Note = new Model('Note', { attributes: [ undefined ] }); }, /M006/, 'fails if one of attribute notations is undefined');
  throws(function(){ var Note = new Model('Note', { attributes: [ null ] }); },      /M006/, 'fails if one of attribute notations is null');
  throws(function(){ var Note = new Model('Note', { attributes: [ 1234 ] }); },      /M006/, 'fails if one of attribute notations is number');
  throws(function(){ var Note = new Model('Note', { attributes: [ true ] }); },      /M006/, 'fails if one of attribute notations is boolean true');
  throws(function(){ var Note = new Model('Note', { attributes: [ false ] }); },     /M006/, 'fails if one of attribute notations is boolean false');
  throws(function(){ var Note = new Model('Note', { attributes: [ $.noop ] }); },    /M006/, 'fails if one of attribute notations is function');
  throws(function(){ var Note = new Model('Note', { attributes: [ [] ] }); },        /M006/, 'fails if one of attribute notations is array');
  throws(function(){ var Note = new Model('Note', { attributes: [ {} ] }); },        /M006/, 'fails if one of attribute notations is object');
  throws(function(){ var Note = new Model('Note', { attributes: [ 'string' ] }); },  /M006/, 'fails if one of attribute notations is invalid notation string');
});

test("fails if at least one attribute's description is not correctly formatted", function () {
  throws(function () {
    var Note = new Model('Note', {
      attributes: [
        '[id] number',
        '[title] string',
        '1nC00rrect attr1bute n0tat10n'
      ]
    });
  },
  /M006/ );
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
  /M007/ );
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
  ok( objectSize(Model._classes) == 2 );
  ok( Model._classes.Note == Note );
  ok( Model._classes.Post == Post );
});


test("fails if class with specified name already exists", function () {
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
  /M003/ );
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
    delete Model._classes.Note;
  }
});

test("Class._callbacks should be there", function () {
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

test("Class.validate", function () {
  // should fail unless 1 argument provided and that argument is an instance of self
  // should return object with attribute error arrays agains attribute names, also instance errors again `_instance` attribute
});

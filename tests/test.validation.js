module("Instance validation", {
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


test("_validateAttr (string validator name)",
function () {
  var note = new Note({ id: 1212, title: "ABC" });
  ok( note._validateAttr('id') === undefined, "should return nothing if atribute has a valid value");

  note.data.id = null;
  ok( note._validateAttr('id') == Model.errCodes.NULL, "should return Model.errCodes.NULL if attribute's value is null when attribute is required");

  note.data.id = undefined;
  ok( note._validateAttr('id') == Model.errCodes.NULL, "should return Model.errCodes.NULL if attributes's value is undefined when attribute is required");

  note.data.title = null;
  ok( note._validateAttr('title') === undefined , "should return undefined if attribute's value is null when attribute is not required");

  note.data.title = undefined;
  ok( note._validateAttr('title') === undefined, "should return undefined if attribute's value is null when attribute is not required");

  note.data.id = 'string';
  ok( note._validateAttr('id') == Model.errCodes.WRONG_TYPE, "should run validators if attibute's value if neither null, not undefined");

  note.data.title = 123;
  ok( note._validateAttr('title') == Model.errCodes.WRONG_TYPE);

  note.data.title = new Date;
  ok( note._validateAttr('title') == Model.errCodes.WRONG_TYPE);
});

test("_validateAttr (array [string validator name, options)",
function () {

  var Post = new Model('Post', function () {
    this.attr('id!', 'number');
    this.attr('title+', 'string');
    this.attr('body', 'string');
    this.attr('lang+', 'string', [ 'in', ['en','ru'] ]);
  });

  var post = new Post({ id: 1212, title: "ABC", lang: '12' });
  ok( post._validateAttr('lang') === Model.errCodes.NOT_IN );

  post.data.lang = 'en';
  ok( post._validateAttr('lang') === undefined );
});

test("_validateAttr (function)",
function () {

  var Post = new Model('Post', function () {
    this.attr('id!', 'number');
    this.attr('title+', 'string', function (value) {
      if (!value.match(/^[0-9A-Z\ ]+$/g)) return 'lowercase';
    });
    this.attr('body', 'string');
  });

  var post = new Post({ id: 1212, title: "abc" });
  ok( post._validateAttr('title') === 'lowercase');

  post.data.title = 'NEW';
  ok( post._validateAttr('title') === undefined );
});

test("_validate",
function () {
  var note = new Note({ id: 1212, title: "ABC" });
  deepEqual( note._validate(), {}, "should return undefined if instance has no validation errors");

  note.data.title = 123;
  deepEqual( note._validate(), { title: Model.errCodes.WRONG_TYPE }, "should return attribute to error map if instance has any validation errors");
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

  deepEqual( note._changesAfterValidation, {}, "new instances should have _hasChangedAfterValidation property");

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

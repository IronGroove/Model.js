module("Class.validate", {
  setup: function () {
    Cls = new Class(function () {
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
  var Cls = new Class(function () {
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
  var Cls = new Class(function () {
    this.attr('id!', 'number');
    this.attr('title+', 'string', function (value) {
      if (!value.match(/^[0-9A-Z\ ]+$/g)) return 'lowercase';
    });
    this.attr('body', 'string');
  });

  ok( Cls.validate('title', 'abc') === 'lowercase');
  ok( Cls.validate('title', 'ABC') === undefined );
});












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

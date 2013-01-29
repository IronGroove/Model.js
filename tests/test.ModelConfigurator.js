module("ModelConfigurator methods", {
  setup: function () {
    cls = {};
    conf = new ModelConfigurator(cls);
  },
  teardown: function () {
    delete cls;
    delete conf;
  }
});

test("some general attributes should be set on a configured class", function () {
  deepEqual( cls._attributes,    {}, '_attributes');
  deepEqual( cls._validators,    {}, '_validators');
  deepEqual( cls._callbacks,     {}, '_callbacks');
  deepEqual( cls.attributeNames, [], 'attributeNames');
  deepEqual( cls.errCodes,       {}, 'errCodes');
});

test("attr should configure attributes on the class", function () {
  // Should fail if 1st argument is not a string!
  throws(function(){ conf.attr(); },          /MC101/, "should fail if 1st argument is omitted");
  throws(function(){ conf.attr(undefined); }, /MC101/, "should fail if 1st argument is explicit undefined");
  throws(function(){ conf.attr(null); },      /MC101/, "should fail if 1st argument is null");
  throws(function(){ conf.attr(false); },     /MC101/, "should fail if 1st argument is boolean false");
  throws(function(){ conf.attr(true); },      /MC101/, "should fail if 1st argument is boolean true");
  throws(function(){ conf.attr(123345); },    /MC101/, "should fail if 1st argument is a number");
  throws(function(){ conf.attr($.noop); },    /MC101/, "should fail if 1st argument is a function");
  throws(function(){ conf.attr(/re/); },      /MC101/, "should fail if 1st argument is a regexp");
  throws(function(){ conf.attr([]); },        /MC101/, "should fail if 1st argument is an array");
  throws(function(){ conf.attr({}); },        /MC101/, "should fail if 1st argument is a plain object");

  conf.attr('slug'); ok( cls.attributeNames.indexOf('slug') >= 0,
    "should add attribute name to a `attributeNames` array if 1st argument is a string");

  throws(function(){ conf.attr('slug'); }, /MC102/,
    "should fail if attibute with that name has been already defined");

  conf.attr('title', 'string nonempty nonnull');
  deepEqual( cls._attributes.title, [ 'string', 'nonempty', 'nonnull' ],
    "should remember validator names specified in attribute description string");

  deepEqual( cls.attributeNames, [ 'slug', 'title' ]);

  conf.attr('id', 'number', true);
  ok( cls.idAttr == 'id');

  deepEqual( cls.attributeNames, [ 'slug', 'title', 'id' ]);
  deepEqual( cls._attributes.id, [ 'number' ]);
  deepEqual( cls._attributes.title, [ 'string', 'nonempty', 'nonnull' ]);
  deepEqual( cls._attributes.slug, []);

  throws(function(){ conf.attr('otherId', 'number', true); }, /MC104/,
    "should fail not allowing to define any other idAttr");
});

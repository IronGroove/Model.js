module("ModelConfigurator", {
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
  deepEqual( cls._rawAttributes, [], '_rawAttributes');
  deepEqual( cls._validators,    {}, '_validators');
  deepEqual( cls._callbacks,     {}, '_callbacks');
  deepEqual( cls.errCodes,       {}, 'errCodes');
  ok( cls.errCodes === conf.errCodes, 'errCodes should be by reference copied into the configurator');
});

test("configurator should become bound to a class", function () {
  ok( conf._cls == cls );
});


test("#attr — should receive only a `id!+` like string as a 1st (attribute description) argument",
function () {
  throws( function(){ conf.attr(); },           /MC201/, "omitted");
  throws( function(){ conf.attr(undefined); },  /MC201/, "undefined");
  throws( function(){ conf.attr(null); },       /MC201/, "null");
  throws( function(){ conf.attr(false); },      /MC201/, "false");
  throws( function(){ conf.attr(true); },       /MC201/, "true");
  throws( function(){ conf.attr(123345); },     /MC201/, "number");
  throws( function(){ conf.attr(123.45); },     /MC201/, "number 2");
  throws( function(){ conf.attr($.noop); },     /MC201/, "function");
  throws( function(){ conf.attr(/re/); },       /MC201/, "regexp");
  throws( function(){ conf.attr([]); },         /MC201/, "array");
  throws( function(){ conf.attr({}); },         /MC201/, "plain object");
  throws( function(){ conf.attr(''); },         /MC202/, "string: empty");
  throws( function(){ conf.attr('str1ng'); },   /MC202/, "string: with a number");
  throws( function(){ conf.attr('111111'); },   /MC202/, "string: numeric");
  throws( function(){ conf.attr(' title'); },   /MC202/, "string: with whitespace");
  throws( function(){ conf.attr('title '); },   /MC202/, "string: with whitespace 2");
  throws( function(){ conf.attr('tit le'); },   /MC202/, "string: with whitespace 3");
  throws( function(){ conf.attr('titl+e'); },   /MC202/, "string: plus in a wrong place");
  throws( function(){ conf.attr('+title'); },   /MC202/, "string: plus in a wrong place 2");
  throws( function(){ conf.attr('titl!e'); },   /MC202/, "string: exsign in a wrong place");
  throws( function(){ conf.attr('!title'); },   /MC202/, "string: exsign in a wrong place 2");
  throws( function(){ conf.attr('+'); },        /MC202/, "string: only plus");
  throws( function(){ conf.attr('!'); },        /MC202/, "string: only exclamatory sign");
  throws( function(){ conf.attr('+!'); },       /MC202/, "string: both signs");
  throws( function(){ conf.attr('!+'); },       /MC202/, "string: both signs 2");
  throws( function(){ conf.attr('title+!'); },  /MC202/, "string: signs wrong order");

  conf.attr('title');   ok(true, "correct attribute description: single attribute name");
  conf.attr('title!');  ok(true, "correct attribute description: attribute name with exsign");
  conf.attr('title+');  ok(true, "correct attribute description: attribute name with plus");
  conf.attr('title!+'); ok(true, "correct attribute description: attribute name with both signs");
});

test("#attr — all further arguments should be correct validators",
function () {
  throws( function(){ conf.attr('title', undefined); },       /MC203/, "undefined");
  throws( function(){ conf.attr('title', null); },            /MC203/, "null");
  throws( function(){ conf.attr('title', 123345); },          /MC203/, "number");
  throws( function(){ conf.attr('title', 123.45); },          /MC203/, "number 2");
  throws( function(){ conf.attr('title', false); },           /MC203/, "false");
  throws( function(){ conf.attr('title', true); },            /MC203/, "true");
  throws( function(){ conf.attr('title', /re/); },            /MC203/, "regexp");
  throws( function(){ conf.attr('title', {}); },              /MC203/, "plain object");

  throws( function(){ conf.attr('title', ''); },              /MC203/, "string: empty");
  throws( function(){ conf.attr('title', 'str1ng'); },        /MC203/, "string: with a number");
  throws( function(){ conf.attr('title', '111111'); },        /MC203/, "string: numeric");
  throws( function(){ conf.attr('title', ' title'); },        /MC203/, "string: with whitespace");
  throws( function(){ conf.attr('title', 'title '); },        /MC203/, "string: with whitespace 2");
  throws( function(){ conf.attr('title', 'tit le'); },        /MC203/, "string: with whitespace 3");

  throws( function(){ conf.attr('title', []); },              /MC203/, "array: empty");
  throws( function(){ conf.attr('title', ['string']); },      /MC203/, "array: 1");
  throws( function(){ conf.attr('title', ['string',1,2]); },  /MC203/, "array: 3");
  throws( function(){ conf.attr('title', [undefined,1]); },   /MC203/, "array: 2 && [0] is undefined");
  throws( function(){ conf.attr('title', [null,1]); },        /MC203/, "array: 2 && [0] is null");
  throws( function(){ conf.attr('title', [false,1]); },       /MC203/, "array: 2 && [0] is false");
  throws( function(){ conf.attr('title', [true,1]); },        /MC203/, "array: 2 && [0] is true");
  throws( function(){ conf.attr('title', [123345,1]); },      /MC203/, "array: 2 && [0] is number");
  throws( function(){ conf.attr('title', [123.45,1]); },      /MC203/, "array: 2 && [0] is number 2");
  throws( function(){ conf.attr('title', ['1234',1]); },      /MC203/, "array: 2 && [0] is numeric string");
  throws( function(){ conf.attr('title', [$.noop,1]); },      /MC203/, "array: 2 && [0] is function");
  throws( function(){ conf.attr('title', [/re/,1]); },        /MC203/, "array: 2 && [0] is regexp");
  throws( function(){ conf.attr('title', [[],1]); },          /MC203/, "array: 2 && [0] is array");
  throws( function(){ conf.attr('title', [{},1]); },          /MC203/, "array: 2 && [0] is plain object");

  throws( function(){ conf.attr('title', ['',1]); },          /MC203/, "array: 2 && [0:string] empty");
  throws( function(){ conf.attr('title', ['string ',1]); },   /MC203/, "array: 2 && [0:string] contains whitespace");
  throws( function(){ conf.attr('title', [' string',1]); },   /MC203/, "array: 2 && [0:string] contains whitespace 2");
  throws( function(){ conf.attr('title', ['str ing',1]); },   /MC203/, "array: 2 && [0:string] contains whitespace 3");
  throws( function(){ conf.attr('title', ['str1ng',1]); },    /MC203/, "array: 2 && [0:string] contains numbers");

  conf.attr('title!', $.noop);            ok(true, "correct validator: function");
  conf.attr('title', 'string');           ok(true, "correct validator: correct string validator name");
  conf.attr('title+', ['minlength', 6]);  ok(true, "correct validator: 2-args array with [0] being a correct string validator name");
});

test("#attr — should produce correct results",
function () {
  conf.attr('title');
  ok( cls._rawAttributes.length == 1, "should push attribute data objects to Class._attributes" );
  deepEqual( cls._rawAttributes[0], { name: 'title', required: false, idAttr: false, validators: [] });

  conf.attr('title+', 'abc', ['ab', 123], $.noop);
  ok( cls._rawAttributes.length == 2, "should not replace data for previously described attribute with same name in Class._attributes" );
  deepEqual( cls._rawAttributes[1], { name: 'title', required: true, idAttr: false, validators: ['abc', ['ab', 123], $.noop] });

  conf.attr('title!', 'a', 'b');
  ok( cls._rawAttributes.length == 3 );
  deepEqual( cls._rawAttributes[2], { name: 'title', required: false, idAttr: true, validators: ['a', 'b'] });

  conf.attr('title!+', 'string', $.noop);
  ok( cls._rawAttributes.length == 4 );
  deepEqual( cls._rawAttributes[3], { name: 'title', required: true, idAttr: true, validators: ['string', $.noop] });
});


test('processRawAttributes',
function () {
  throws(function () {
    var attrData = ModelConfigurator.processRawAttributes([ { name: 'title', required: false, idAttr: true, validators: ['string', 'nonempty'] },
                                                            { name: 'slug',  required: false, idAttr: true, validators: ['string'] } ]);
  }, /MC101/, "should fail when multiple attributes are flagged as id attribute");

  throws(function () {
      var attrData = ModelConfigurator.processRawAttributes([ { name: 'title', required: false, idAttr: true, validators: ['string', 'empty'] } ]);
  }, /MC102/, "should fail when attributes described with unknown validators");
});

test("processRawAttributes — should remove duplicates in favour of the most recent declaration",
function () {
  var attrData = ModelConfigurator.processRawAttributes([ { name: 'title', required: false, idAttr: true, validators: ['string', 'nonempty'] },
                                                          { name: 'slug',  required: true,  idAttr: false, validators: ['number'] },
                                                          { name: 'slug',  required: false, idAttr: false, validators: ['string'] },
                                                          { name: 'title', required: true, idAttr: false, validators: ['number'] } ]);
  ok( attrData.idAttr === undefined );
  deepEqual( attrData.requiredAttributes, [ 'title' ]);
  deepEqual( attrData.attributeNames, [ 'title', 'slug' ]);
  deepEqual( attrData.attributeValidators, { title: ['number'], slug: ['string'] });
});

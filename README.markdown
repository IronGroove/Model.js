# Models for javascripting

Model.js introduces new simple way of maintaining model layers in javascript applications. As of version v0.1, this library provides handy and readable data describing, data validation capabilities and event machinery for bindings on major data lifecycle events.

*All this is better explained by example.*

```javascript
// DESCRIBE
var Note = new Model('Note', function () {
  this.attr('id!', 'number');
  this.attr('title+', 'string', 'nonempty');
  this.attr('lang+', 'string', [ 'in', ['en','uk','ru']]);
  this.attr('text', 'string');
});

Note.bind('initialize', function () {
  if (!this.data.lang) {
    this.set('lang', 'en');
  }
});

// AMPLIFY
Note.prototype.save = function () {
  var note = this,
    data = note.data();
  window.localStorage.setItem("Note"+data.id, JSON.stringify(data));
  note._persist();
}

var note = new Note({ title: "Hello" });

assert( note.isNew );
assert( note.data.title == "Hello" );
assert( note.data.lang == "en" );
assert( note.hasChanged );
assert( note.isValid );

// INTEGRATE
note.bind('change', function (changes) {
  if (changes.title) {
    document.getElementById('note-title').innerHTML = changes.title;
  }
});

note.data.title = '';
assert( !note.isValid );
assert( note.errors.title == Model.errCodes.EMPTY );

note.data.title = "Let's go!";

// Designed to be Django-style.
if (note.isValid) {
  note.save();
}

assert( !note.isNew );
```

*And now, all these features in details.*


## Defining models (describing data)

`new Model` receives two arguments and creates new model classes. These arguments are the name of the model class being created and the configuration function.

Configuration functions are actually sugar that allows to configure classes in a fancy manner. Currently there's only `attr` method in configuration function context and it is used to define attributes.

`attr` may receive multiple arguments. The 1st argument should be string name of the attribute. That name may end with a plus sign which is used to mark attributes that should have value (namely, required attributes) or exclamation mark which indicates primary key (of course, primary key is required too).

All following arguments should be _validators_ for the attribute's value.


### Validators

Validator is a simple function receiving value to validate and returning some string error code when value is invalid. It may also receive other arguments though. Validators defined on attributes are run when `instance.isValid` or `instance.errors` is called.

```javascript
function minLength(value, minLen) {
  return (typeof value === 'string' && value.length >= minLen) ? 'tooshort' : undefined;
}
```

There is a number of predefined common validators in Model.js (`number`, `string`, `boolean`, `nonnull`, `nonempty` and `in`) so that when defining attributes on new models, you may just write their names.

```javascript
var Note = new Model('Note', function () {
  this.attr('id!', 'number');
  this.attr('title', 'nonnull', 'string', 'nonempty');
  this.attr('lang', 'nonnull', 'string', [ 'in', ALLOWED_LANGUAGES ]);
  this.attr('text', function (value) {
  	return typeof value === 'string';
  });
});
```
When you want to pass additional arguments to validator, like checking if `lang` value is one of the ALLOWED_LANGUAGES, add that validator to an attribute in an array form as in example above.

Common reusable validators, such as mentioned `number`, `string` and other, may be registed with `Model.registerValidator` which received two arguments, the name and the function.

```javascript
Model.registerValidator('maxLen', function maxLength(value, maxLen) {
  return (typeof value === 'string' && value.length <= minLen) ? 'toolong' : undefined;
});
```

To say, attribute names with a plus sign at the end are just shortcuts to avoid that long unpretty _'nonnull'_ validator names. But you may still use _'nonnull'_ if you like it more.


## Working with data

### Instance

Instances are created with `new Note({…})` form and all instances tend to be persisted on creation.

If you're creating absolutely new instance which is not yet persisted (e.g. from data taken right out of an HTML form) you should use `new Note(false, {…})` form where 1st argument is an explicit persistance flag. You may set it to `true`, but there's no need to do so as `new Note(true, {…})` actually produces same result as `new Note({…})`.

Persisting on creation will fail silently when data provided has no PK { attrName: value} pair but a model class has a primary key defined.


### Setters

There are two kinds of setters. There are those which trigger change event on instances and those which don't.

```javascript
// These two setters trigger it
note.data.title = "Hi there";
note.data = { title: "Hi there", lang: "en" };

// … and these two don't.
note.set('title', "Hi there");
note.set({ title: "Hi there", lang: "en" });
```


### Getters

`note.data.title` returns value of a single attribute.

`note.data.get('title', 'lang')` returns specific attributes' values in an object of { attrName: value } pairs.

To get whole instace's data use `note.data()` or `note.get()`.


### Changes

`note.hasChanged` tells if instance data has been changed since its latest persisting.

`note.isNew` well yes, it tells if instance is new (has never been persisted).

`note.isPersisted` tells whether instance changes are persisted and there are no pending changes to persist.

`note._revert()` is rolling back all changes made on instance data and triggers `revert` event that application may bind handlers on.

`note._persist()` is persisting changes made on instance data and triggers `persist` event. This method should be called right after application has made sure that data is persisted.

To say, in web environment when persisting data with ajax, `_persist` should be called in success stage and _revert` may be called if request fails and it makes sense for the application.

```javascript
Note.prototype.save = function () {
  var note = this;
  return $.ajax({
    type: 'PUT',
    url: '/notes/'+note.data.id,
    data: note.data(),
    dataType: 'json'
  }).done(function (json) {
    note._persist();
  });
}
```


## Events

`initialize` is triggered on instance creation, right on `var note = new Note;`.

`change` is triggered every time attributes' values are changed like `note.data.title = "Hi"` or like `note.data = {…}`.

`change` is not triggered though when setting values on attributes with `set` method.

Handlers bound to `change` event receive data object of changes made (see example below).

`persist` and `revert` are triggered when their corresponding methods are called.

You may bind event handlers either on model classes so that they subsequently refer to all instances or on specific instances.

```javascript
Note.bind('initialize', function () {
  if (!this.data.lang) {
    this.set('lang', 'en');
  }
});

note.bind('change', function (changes) {
  if (changes.title) {
    document.getElementById('note-title').innerHTML = changes.title;
  }
});
```

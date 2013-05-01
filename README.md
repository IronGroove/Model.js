Models for javascripting.


# Create

Define your data models in a simple readable way.

```javascript
var Note = new Model('Note', function () {
  this.attr('id!', 'number');
  this.attr('title+', 'string', 'nonempty');
  this.attr('lang+', 'string', [ 'in', ['en', 'uk', 'ru']]);
  this.attr('text', 'string');
});

// title+ means that title attribute value cannot be null.
// id! means that id attribute is the primary key.
```


# Work

Get syntactical sugar for working with your data.

```javascript
var note = new Note({ title: "Model.js is awesome" });
note.isNew // true
note.hasChanged // false
note.data.title = '';
note.hasChanged // true
```


Enjoy easy one-method data validation according to attribute definitions.

```javascript
note.isValid // false
note.errors  // { title: Model.errCodes.EMPTY }
```


# Extend

Extend your models for purposes of your application via prototype.

For example, set up your specific way of persisting the data.

```javascript
Note.prototype.save = function () {
  var note = this, data = note.data();
  window.localStorage.setItem("Note:"+data.id, JSON.stringify(data));
  note._persist();
}

// NOTE _persist() private call is needed to change inner state and trigger the persist event.
```


# Integrate

Have all the event machinery at your disposal.

Bind event handlers to specific instances.

```javascript
note.bind('change', function (changes) {
  // NOTE !!changes.title condition is false when title is empty.
  if (changes.title !== undefined) $('h1').html(changes.title);
});
```

Or bind handlers to classes, so that they become common to all instances.

```javascript
Note.bind('initialize', function () {
  if (!this.data.lang) this.set('lang', 'en');
});
```


# Documentation

Please refer to [the Model.js wiki](https://github.com/IronGroove/Model.js/wiki) for documentation and check out [the demo](https://raw.github.com/IronGroove/Model.js/master/demo/demo.html) for an example usage.

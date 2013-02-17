Models for javascripting.


# Create

Define your data models in a simple readable way.

```javascript
var Note = new Model('Note', function () {
  this.attr('id!', 'number');
  this.attr('title+', 'string', [ 'minlength', 8 ]);
  this.attr('text', 'string');
});
```

# Work

Get syntactical sugar for working with your data.

```javascript
var note = new Note({ title: "Model.js is awesome" });
note.data.title = '';
note.isNew // true
note.hasChanged // false
```


Enjoy easy one-method data validation according to attribute definitions.

```javascript
note.isValid // false
note.errors  // { title: Model.errCodes.TOO_SHORT }
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
```


# Integrate

Have all the event machinery at your disposal.

Bind event handlers to specific instances.

```javascript
note.bind('change', function (changes) {
  if (changes.title) alert("Title changed!");
});
```

Or bind handlers to classes, so that they become common to all instances.

```javascript
Note.bind('initialize', function () {
  if (this.data.id) {
    alert("Note #"+this.data.id+" is initialized!");
  }
});
```


# TODO

- beforeValidate event
- revert() and revert event
- Model.dispose('Note', id)

Models for javascripting.

    var User = new Model('User', function () {
      this.attr('id', 'nonnull number', true);
      this.attr('displayName', 'nonnull nonempty string');
      this.attr('email', 'null nonempty string email');
    });

    var Note = new Mode('Note', function () {
      this.attr('id', 'nonnull number', true);
      this.attr('title', 'nonnull nonempty string');
    });


    Model.registerValidator('null', function (value) {
      return true;
    });

    Model.errCodes.INVALID_EMAIL = 'invalidemail';
    Model.registerValidator('email', function (value) {
      if (!isValidEmail(value)) return Model.errCodes.INVALID_EMAIL;
    });


    Note(1) // Returns an instance if it is initialized or undefined if instance hasn't been initialized.

    // Few examples on instances which need to be created with ids known in advance.
    new Note({…})                  // not persisted:  isNew == true   isChanged == false  isPersisted=false
    new Note({ id: 123, …})        // persisted:      isNew == false  isChanged == false  isPersisted=true
    new Note(false, { id: 123, …}) // not persisted:  isNew == true   isChanged == false  isPersisted=false

    var note = new Note({ title: "Unknown" });
    note.isNew     // true
    note.isChanged // false
    note.data.title = "Abecedario";
    note.isChanged // true
    note.revert();
    note.isChanged // false
    note.data.title = "Alphabet";
    note.isChanged // true
    note._changes  // { title: "Unknown" }
    note.isValid   // true, calls note._validate()
    note.save();   // should call note._persist() when instance persisted or note._rollback() if shit happened
    note.isChanged // false

    // Set up event handlers related to all instances of a Model class.
    Note.bind('initialize', handler);
    Note.bind('beforeValidate', handler);

    // Set up event handlers related to a specific instance.
    note.bind('change', handler);
    note.bind('revert', handler);
    note.bind('save', handler);
    note.bind('persist', handler);
    note.bind('rollback', handler);

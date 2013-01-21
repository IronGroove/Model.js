Models for javascripting.


    Model.registerValidator('null', function (value) {
      return true;
    });

    Model.registerValidator('email', function (value) {
      if (!isValidEmail(value)) return Model.errCodes.INVALID_EMAIL;
    });

    var Note = new Model('Note', {
      attributes: [
          '[id] nonnull number',
          '[title] nonnull nonempty string',
          '[email] null nonempty string email'  // email is not required
        ]
    });

    Note(1) // returns an instance if it is initialized
    Note(2) // or returns undefined if instance hasn't been initialaized

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



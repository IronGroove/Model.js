Models for javascripting.


    COUNTRIES = [ 'USA', 'Ukraine' ];
    LOCALES = [ 'en', 'uk' ];

    var User = new Model('User', function () {

      var errCodes = this.errCodes;

      errCodes.FORBIDDEN_AVATAR_HOST = 'forbiddenavatarhost';
      errCodes.INVALID_POSTAL_CODE = 'invalidpostalcode';

      this.attr('id!+',         'number');
      this.attr('displayName+', 'string', 'nonempty');
      this.attr('email+',       'string', 'email');
      this.attr('country+',     'string', ['in', COUNTRIES]);
      this.attr('locale',       'string', 'nonempty', ['in', LOCALES]);  // may be null
      this.attr('postalCode+',  'string', 'nonempty');
      this.attr('avatarUrl+',   'string', 'url', function (value) {
        var host = hostFromURL(value);
        if (host != 'gravatar.com') return errCodes.FORBIDDEN_AVATAR_HOST;
      });

      this.validates(function (data) {
        if (!validatePostalCode(data.postalCode, data.country) {
          return errCodes.INVALID_POSTAL_CODE;
        }
      });
    });

    var Note = new Mode('Note', function () {
      this.attr('id!',    'number');
      this.attr('title+', 'string', ['minlength', 8]);

      this.beforeValidation(function () {
        this.data.title = $.trim(this.data.title);
      });
    });

    Note.bind('beforeValidate', function () {
      this.data.title = $.trim(this.data.title);
    });


    Model.errCodes.INVALID_EMAIL = 'invalidemail';
    Model.registerValidator('email', function (value) {
      if (!isValidEmail(value)) return Model.errCodes.INVALID_EMAIL;
    });



    Note(1) // Returns an instance if it is initialized or undefined if instance hasn't been initialized.

    // Few examples on instances which need to be created with ids known in advance.
    new Note({…})                  // isNew == true   isPersisted == false
    new Note({ id: 123, …})        // isNew == false  isPersisted == true
    new Note(false, { id: 123, …}) // isNew == true   isPersisted == false

    var note = new Note({ title: "Unknown" });
    note.isNew                        // true
    note.hasChanged                   // false
    note.data.title = "Abecedario";
    note.hasChanged                   // true
    note.revert();
    note.hasChanged                   // false
    note.data.title = "Alphabet";
    note.hasChanged                   // true
    note._changes                     // { title: "Unknown" }
    note.isValid                      // true
    note.save();                      // should call note._persist() when instance persisted or note._revert() if shit happened
    note.hasChanged                   // false

    // Set up event handlers related to all instances of a Model class.
    Note.bind('initialize', handler);
    Note.bind('beforeValidate', handler);

    // Set up event handlers related to a specific instance.
    note.bind('change', handler);
    note.bind('revert', handler);
    note.bind('persist', handler);


TODO

- beforeValidate event
- revert() and revert event
- Model.dispose('Note', id)

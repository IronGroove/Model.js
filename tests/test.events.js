module("Events", {
  setup: function () {
    Note = new Model('Note', function () {
      this.attr('id!',   'string');
      this.attr('title+', 'string');
      this.attr('lang+',  'string');
    });
  },
  teardown:function () {
    delete Note;
    delete Model._classes.Note;
  }
});

test("initialize",
function () {
  Note.bind('initialize', function () {
    if (!this.data.lang) this.data.lang = 'en';
  });

  var note = new Note({ id: 123, title: "ABC" });
  ok( note.data.lang == 'en' );
});

test("change",
function () {
  var changes = [];

  Note.bind('change', function (change) {
    if (change.title) changes.push('title:'+change.title);
  });

  var note = new Note({ id: 123, title: "ABC" });
  note.data.title = "Some";
  deepEqual( changes, [ 'title:Some' ]);

  note.bind('change', function (change) {
    if (change.id) changes.push('id:'+change.id);
  });

  note.data = { id: 1234, title: "New" };
  deepEqual( changes, [ 'title:Some', 'title:New', 'id:1234' ]);


  note.data = { id: 1234, title: "New" };
  deepEqual( changes, [ 'title:Some', 'title:New', 'id:1234' ], "should not be triggered if data left unchanged");
});

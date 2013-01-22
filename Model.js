// TODO Get rid of $.isPlainObject and $.extend jQuery sugar.

Model = (function () {

  function ModelError(code, message) {
    this.code = code;
    this.message = message;
  }

  ModelError.prototype.toString = function () {
    return this.code + ': ' + this.message;
  }


  function Model(name, options) {
    if (this.constructor != Model) {
      throw new ModelError('M01',
        "new Model classes should be created with keyword `new`!");
    }

    if (typeof name != 'string') {
      throw new ModelError('M02',
        "`new Model` expects its 1st argument to be a string name of a new class!");
    }

    if (Model.classes[name]) {
      throw new ModelError('M07',
        'models class with that name already exists!');
    }

    if (!$.isPlainObject(options)) {
      throw new ModelError('M03',
        "`new Model` expects its 2nd argument to be an options object!");
    }

    if (!options.attributes ||
          options.attributes.constructor.name !== 'Array' ||
            options.attributes.length === 0) {
      throw new ModelError('M04',
        "new model's options should contain a nonempty array of attribute definitions!");
    }

    var i, j, attrName,
      attrNotation,
      attrDescribed,
      attributesDescribed = [],
      attributeNames = [];

    for (var i = 0; i < options.attributes.length; i++) {
      attrNotation = options.attributes[i];
      attrDescribed = Model._parseAttributeNotation(attrNotation);
      if (attrDescribed === false) {
        throw new ModelError('M05',
          "attributes should be valid notation strings!");
      }
      attributesDescribed.push( attrDescribed );
    }

    for (var i = 0; i < attributesDescribed.length; i++) {
      attrDescribed = attributesDescribed[i];
      for (var j = 0; j < attrDescribed.validators.length; j++) {
        if (!Model._validators[attrDescribed.validators[j]]) {
          throw new ModelError('M06',
            "attributes should be described with existing validators!");
        }
      }
    }


    var DataFunctionPrototype = {};

    function Class() {

      if (this.constructor != Class) {
        throw new ModelError('C01',
          "Class instances should be created with keyword `new`!");
      }

      var instance = this, persistanceFlag, data, dataFn;

      if (arguments.length == 0) {
        data = {};
      }

      else if (arguments.length == 1) {
        if (typeof(arguments[0]) == 'boolean') {
          persistanceFlag = arguments[0];
          data = {};
        }
        else if ($.isPlainObject(arguments[0])) {
          data = arguments[0];
        }
        else {
          throw new ModelError('C02',
            "when a Class constructor receives one argument, "+
            "it should be either a boolean persistance flag or a data object!");
        }
      }

      else if (arguments.length == 2) {
        if (typeof(arguments[0]) == 'boolean' && $.isPlainObject(arguments[1])) {
          persistanceFlag = arguments[0];
          data = arguments[1];
        }
        else {
          throw new ModelError('C03',
            "when a Class constructor receives two arguments, "+
            "they should be a boolean persistance flag and a data object!");
        }
      }

      else {
        throw new ModelError('C04',
          "a Class constructor should be provided no more than 2 arguments!");
      }


      instance._data = {};
      instance._changes = {};
      instance._callbacks = {};

      instance._isPersisted = typeof(persistanceFlag) == 'boolean' ?
        persistanceFlag : !!data[Class.idAttr];

      if (instance._isPersisted && data[Class.idAttr] === undefined) {
        throw new ModelError('C05',
          "instance cannot be explicitly persisted on creation if it has no id attribute set!");
      }

      for (var attrName in data) {
        if (Class.attributes.indexOf(attrName) >= 0) {
          instance._data[attrName] = data[attrName];
        }
      }

      instance._data2 = dataFn = function () {
        if (arguments.length == 1 && arguments[0] === undefined) return instance;
        return $.extend({}, instance._data);
      }

      dataFn.prototype = dataFn.__proto__ = DataFunctionPrototype;
    }


    Class.className = name;

    Class.attributes = [];
    Class._validators = {};
    Class._callbacks = {};

    for (i = 0; i < attributesDescribed.length; i++) {
      attrName = attributesDescribed[i].attrName;
      Class.attributes.push( attrName );
      Class._validators[ attrName ] = $.extend([], attributesDescribed[i].validators);
    }

    Class.idAttr = Class.attributes[0];


    for (var i = 0; i < Class.attributes.length; i++) {
      (function (attrName) {
        DataFunctionPrototype.__defineGetter__(attrName, function () {
          var instance = this(undefined);
          return instance._get(attrName);
        });
        DataFunctionPrototype.__defineSetter__(attrName, function (value) {
          var instance = this(undefined);
          instance._set(attrName, value);
        });
      })(Class.attributes[i]);
    }


    Class.prototype.__defineGetter__('data', function () {
      return this._data2;
    });

    Class.prototype.__defineSetter__('data', function (data) {
      if (!$.isPlainObject(data)) {
        throw new ModelError('C03',
          "instance.data= setter accepts plain objects only!");
      }

      var instance = this;
      for (var attrName in data) {
        if (Class.attributes.indexOf(attrName) >= 0) {
          instance._set(attrName, data[attrName]);
        }
      }
    });

    Class.prototype.__defineGetter__('isNew', function () {
      return this._data[ this.constructor.idAttr ] === undefined;
    });

    Class.prototype.__defineGetter__('isPersisted', function () {
      return this._isPersisted;
    });

    Class.prototype.__defineGetter__('isChanged', function () {
      var changed = false;
      for (var k in this._changes) { changed = true; break; }
      return changed;
    });

    Class.prototype.__defineGetter__('isValid', function () {});

    Class.prototype._get = function (attrName) {
      return this._data[attrName];
    }

    Class.prototype._set = function (attrName, value) {
      if (this._data[attrName] !== value) {
        if (this._changes[attrName] === value) {
          delete this._changes[attrName];
          this._data[attrName] = value;
        } else {
          if (this._changes[attrName] === undefined) {
            this._changes[attrName] = this._data[attrName];
          }
          this._data[attrName] = value;
        }
      }
    }

    Class.bind = function (eventName, handler) {
      if (typeof(eventName) != 'string' ||
            Model._classEventNames.indexOf(eventName) == -1 ||
              typeof(handler) != 'function') {
        throw new ModelError('C06',
          "Class.bind method should be provided with a valid "+
          "string eventName and a function handler!");
      }

      if (Class._callbacks[eventName] === undefined) {
        Class._callbacks[eventName] = [];
      }

      Class._callbacks[eventName].push(handler);
    }

    Class.prototype.bind = function (eventName, handler) {
      if (typeof(eventName) != 'string' ||
            Model._instanceEventNames.indexOf(eventName) == -1 ||
              typeof(handler) != 'function') {
        throw new ModelError('I06',
          "instance.bind method should be provided with a valid "+
          "string eventName and a function handler!");
      }

      if (this._callbacks[eventName] === undefined) {
        this._callbacks[eventName] = [];
      }

      this._callbacks[eventName].push(handler);
    }

    Class.prototype._trigger = function (eventName) {
      var i, Class = this.constructor;
      if (typeof(eventName) != 'string' ||
            Model._classEventNames.indexOf(eventName) == -1 ||
              Model._instanceEventNames.indexOf(eventName) == -1) {
        throw new ModelError('I07',
          "instance._trigger should be provided a valid event name!");
      }

      if (Class._callbacks[eventName]) {
        for (i = 0; i < Class._callbacks[eventName].length; i++) {
          Class._callbacks[eventName][i].call(this, this);
        }
      }

      if (this._callbacks[eventName]) {
        for (i = 0; i < this._callbacks[eventName].length; i++) {
          this._callbacks[eventName][i].call(this, this);
        }
      }
    }

    Class.prototype.get = function (attr) {
      if (!arguments.length) {
        return this.data();
      }

      for (var i = 0; i < arguments.length; i++) {
        if (typeof(arguments[i]) != 'string' ||
              Class.attributes.indexOf(arguments[i]) == -1) {
          throw new ModelError('P01',
            "instance.get method should be provided valid attribute names only!");
        }
      }

      if (arguments.length == 1) {
        return this._get(attr);
      }

      var data = {}; for (var i = 0; i < arguments.length; i++) {
        data[ arguments[i] ] = this._data[ arguments[i] ];
      }

      return data;
    };

    Class.prototype.set = function (attrName, value) {
      if (typeof(attrName) != 'string' ||
            Class.attributes.indexOf(attrName) == -1 ||
              arguments.length != 2) {
        throw new ModelError('P02',
          "instance.set method should be provided two argument and first"+
          "of them should be a valid string attribute name!");
      }
      this._set(attrName, value);
    };

    Model.classes[name] = Class;

    return Class;
  }



  Model._classes = {};
  Model._validators = {};
  Model._classEventNames = 'initialize change'.split(' ');
  Model._instanceEventNames = 'change persist'.split(' ');

  Model.errCodes = {};
  Model.errCodes.WRONG_TYPE = 'wrongtype';
  Model.errCodes.NULL = 'null';
  Model.errCodes.EMPTY = 'empty';


  Model._parseAttributeNotation = function (attrNotation) {
    var attrName, validators = [], matches, i, validatorsRaw;

    if (typeof attrNotation !== 'string') return false;

    matches = attrNotation.match(/^\s*\[([a-zA-Z]+)\]\s*([a-zA-Z\s]*)$/);
    if (!matches) return false;

    attrName = matches[1];
    validatorsRaw = matches[2].split(/\s+/);

    for (i = 0; i < validatorsRaw.length; i++) {
      if (validatorsRaw[i].length  &&  validators.indexOf(validatorsRaw[i]) === -1) {
        validators.push(validatorsRaw[i]);
      }
    }

    return {
      attrName: attrName,
      validators: validators
    };
  };

  Model.registerGeneralValidator = function (name, fn) {
    if (typeof name != 'string' ||
          !name.match(/^[a-zA-Z]+$/) ||
            typeof fn != 'function' ||
              !!Model._validators[name]) {
      throw new ModelError('M01',
        "`Model.registerGeneralValidator` expects its 1st argument to be "+
        "a [a-zA-Z]+ string name of a new validator, its 2nd argument to "+
        "be actual validator function!");
    }

    Model._validators[name] = fn;
  };


  Model.registerGeneralValidator('number', function (value) {
    if (typeof(value) != 'number') return Model.errCodes.WRONG_TYPE;
  });

  Model.registerGeneralValidator('string', function (value) {
    if (typeof(value) != 'string') return Model.errCodes.WRONG_TYPE;
  });

  Model.registerGeneralValidator('boolean', function (value) {
    if (typeof(value) != 'boolean') return Model.errCodes.WRONG_TYPE;
  });

  Model.registerGeneralValidator('nonnull', function (value) {
    if (value === null) return Model.errCodes.NULL;
  });

  Model.registerGeneralValidator('nonempty', function (value) {
    if (typeof(value) != 'string') return;
    if (value === '') return Model.errCodes.EMPTY;
  });

  return Model;

})();

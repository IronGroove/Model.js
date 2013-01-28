// TODO Get rid of $.isPlainObject, $.trim and $.extend jQuery sugar.
// TODO Turn Class.attributeNames into an immutable getter.


Model = (function () {


  function ModelError(code, message) {

    // ModelError codes stick to the following convention:
    // - M0** Model constructor errors
    // - M1** Model class method errors
    // - M2** Model prototype method errors
    // - C0** Class constructor errors
    // - C1** Class class method errors
    // - C2** Class prototype method errors
    // - MC1** ModelConfigurator prototype methods

    this.code = code;
    this.message = message;
  }

  ModelError.prototype.toString = function () {
    return this.code + ': ' + this.message;
  }






  function ModelConfigurator(Class) {
    Class.attributeNames = [];
    Class._attributes = {};
    this._cls = Class;
  }

  var MC = ModelConfigurator;  // Just a convenience.

  MC.prototype.attr = function (name, description, idAttrFlag) {
    var Class = this._cls,
      validators = [];

    if (typeof(name) != 'string') {
      throw new ModelError('MC101',
        "1st argument of a `attr` method should be a string!");
    }

    if (Class.attributeNames.indexOf(name) >= 0) {
      throw new ModelError('MC102',
        "Attribute `"+name+"` is already added to "+Class.className+"!");
    }

    if (description && typeof(description) != 'string') {
      throw new ModelError('MC103',
        "2nd argument of a `attr` method should be either omitted or a string!");
    }

    if (description) {
      description = $.trim(description);
      validators = description.split(/\s+/);
    }

    if (!!idAttrFlag) {
      if (Class.idAttr !== undefined) {
        throw new ModelError('MC104',
          "The idAttr is already added to "+Class.className+"!");
      }
      Class.idAttr = name;
    }

    Class.attributeNames.push(name);
    Class._attributes[name] = validators;
  }











  function Class(name, configuration) {

    var DataFunctionPrototype = {};

    function Class() {

      if (this.constructor != Class) {
        throw new ModelError('C001',
          "Model Class instances should be created with keyword `new`!");
      }

      var instance = this,
        persistanceFlag,
        data,
        dataFn;

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
          throw new ModelError('C002',
            "When a Model Class constructor receives one argument, "+
            "it should be either a boolean persistance flag or a data object!");
        }
      }

      else if (arguments.length == 2) {
        if (typeof(arguments[0]) == 'boolean' && $.isPlainObject(arguments[1])) {
          persistanceFlag = arguments[0];
          data = arguments[1];
        }
        else {
          throw new ModelError('C003',
            "When a Model Class constructor receives two arguments, "+
            "they should be a boolean persistance flag and a data object!");
        }
      }

      else {
        throw new ModelError('C004',
          "A Model Class constructor should be provided no more than 2 arguments!");
      }


      instance._data = {};
      instance._changes = {};
      instance._callbacks = {};

      instance._isPersisted = typeof(persistanceFlag) == 'boolean' ?
        persistanceFlag : !!data[Class.idAttr];

      if (instance._isPersisted && data[Class.idAttr] === undefined) {
        throw new ModelError('C005',
          "instance cannot be explicitly persisted on creation if it has no id attribute set!");
      }

      for (var attrName in data) {
        if (Class.attributeNames.indexOf(attrName) >= 0) {
          instance._data[attrName] = data[attrName];
        }
      }

      instance._data2 = dataFn = function () {
        if (arguments.length == 1 && arguments[0] === undefined) return instance;
        return $.extend({}, instance._data);
      }

      dataFn.prototype = dataFn.__proto__ = DataFunctionPrototype;
    }

    Class.prototype = Class.__proto__ = this.constructor.prototype;

    Class.className = name;


    // A namespace for complex Class specific validators,
    // like if your domain ends with .dk, your region cannot be Asia.
    Class._validators = {};

    // A namespace for Class specific errCodes returned by Class._validators,
    // like INVALID_REGION_BY_DOMAIN.
    Class.errCodes = {};

    Class._callbacks = {};


    var configurator = new ModelConfigurator(Class);
    configuration.call(configurator, configurator);

    // TODO Sanity checks.

    // Extend DataFunctionPrototype with attribute getters and setters.

    for (var i = 0; i < Class.attributeNames.length; i++) {
      (function (attrName) {
        DataFunctionPrototype.__defineGetter__(attrName, function () {
          var instance = this(undefined);
          return instance._get(attrName);
        });
        DataFunctionPrototype.__defineSetter__(attrName, function (value) {
          var instance = this(undefined);
          instance._set(attrName, value);
        });
      })(Class.attributeNames[i]);
    }

    return Class;
  }


  Class.prototype.bind = function (eventName, handler) {
    var Class = this;
    if (typeof(eventName) != 'string' ||
          Model._classEventNames.indexOf(eventName) == -1 ||
            typeof(handler) != 'function') {
      throw new ModelError('C101',
        "Class.bind method should be provided with a valid "+
        "string eventName and a function handler!");
    }

    if (Class._callbacks[eventName] === undefined) {
      Class._callbacks[eventName] = [];
    }

    Class._callbacks[eventName].push(handler);
  }


  Class.prototype.registerValidator = function (name, fn) {
   //  if (typeof name != 'string' ||
   //        !name.match(/^[a-zA-Z]+$/) ||
   //          typeof fn != 'function' ||
   //            !!Model._validators[name]) {
   //    throw new ModelError('M101',
   //      "`Model.registerValidator` expects its 1st argument to be "+
   //      "a [a-zA-Z]+ string name of a new validator, its 2nd argument to "+
   //      "be actual validator function!");
   //  }
   //
   //  Class._validators[name] = fn;
  }












  var InstancePrototype = {};

  InstancePrototype.__defineGetter__('data', function () {
    return this._data2;
  });

  InstancePrototype.__defineSetter__('data', function (data) {
    if (!$.isPlainObject(data)) {
      throw new ModelError('C003',
        "instance.data= setter accepts plain objects only!");
    }

    var Class = this.constructor,
      instance = this;

    for (var attrName in data) {
      if (Class.attributeNames.indexOf(attrName) >= 0) {
        instance._set(attrName, data[attrName]);
      }
    }
  });

  InstancePrototype.__defineGetter__('isNew', function () {
    return this._data[ this.constructor.idAttr ] === undefined;
  });

  InstancePrototype.__defineGetter__('isPersisted', function () {
    return this._isPersisted;
  });

  InstancePrototype.__defineGetter__('isChanged', function () {
    var changed = false;
    for (var k in this._changes) { changed = true; break; }
    return changed;
  });

  InstancePrototype.__defineGetter__('isValid', function () {
  });

  InstancePrototype.bind = function (eventName, handler) {
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

  InstancePrototype.get = function (attr) {
    if (!arguments.length) {
      return this.data();
    }

    var Class = this.constructor;

    for (var i = 0; i < arguments.length; i++) {
      if (typeof(arguments[i]) != 'string' ||
            Class.attributeNames.indexOf(arguments[i]) == -1) {
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

  InstancePrototype.set = function (attrName, value) {
    var Class = this.constructor;
    if (typeof(attrName) != 'string' ||
          Class.attributeNames.indexOf(attrName) == -1 ||
            arguments.length != 2) {
      throw new ModelError('P02',
        "instance.set method should be provided two argument and first"+
        "of them should be a valid string attribute name!");
    }
    this._set(attrName, value);
  };

  InstancePrototype._get = function (attrName) {
    return this._data[attrName];
  }

  InstancePrototype._set = function (attrName, value) {
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

  InstancePrototype._trigger = function (eventName) {
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










  function Model(name, configuration) {
    if (this.constructor != Model) {
      throw new ModelError('M001',
        "New models should be created with keyword `new`!");
    }

    if (typeof(name) != 'string' ||
          typeof(configuration) != 'function') {
      throw new ModelError('M002',
        "`new Model` expects its 1st argument to be a string name of "+
        "a new class, and its 2nd argument to be a function!");
    }

    if (Model._classes[name]) {
      throw new ModelError('M003',
        'A Model with that name already exists!');
    }

    var cls = new Class(name, configuration);

    var Mediator = new Function;
    Mediator.prototype = InstancePrototype;
    cls.prototype = new Mediator;
    cls.prototype.constructor = cls;

    Model._classes[name] = cls;

    return cls;
  }


  Model._classes = {};
  Model._validators = {};
  Model._classEventNames = 'initialize change'.split(' ');
  Model._instanceEventNames = 'change persist'.split(' ');

  Model.errCodes = {};
  Model.errCodes.WRONG_TYPE = 'wrongtype';
  Model.errCodes.NULL = 'null';
  Model.errCodes.EMPTY = 'empty';


  Model.registerValidator = function (name, fn) {
    if (typeof name != 'string' ||
          !name.match(/^[a-zA-Z]+$/) ||
            typeof fn != 'function' ||
              !!Model._validators[name]) {
      throw new ModelError('M101',
        "`Model.registerValidator` expects its 1st argument to be "+
        "a [a-zA-Z]+ string name of a new validator, its 2nd argument to "+
        "be actual validator function!");
    }

    Model._validators[name] = fn;
  };


  Model.registerValidator('number', function (value) {
    if (typeof(value) != 'number') return Model.errCodes.WRONG_TYPE;
  });

  Model.registerValidator('string', function (value) {
    if (typeof(value) != 'string') return Model.errCodes.WRONG_TYPE;
  });

  Model.registerValidator('boolean', function (value) {
    if (typeof(value) != 'boolean') return Model.errCodes.WRONG_TYPE;
  });

  Model.registerValidator('nonnull', function (value) {
    if (value === null) return Model.errCodes.NULL;
  });

  Model.registerValidator('nonempty', function (value) {
    if (typeof(value) != 'string') return;
    if (value === '') return Model.errCodes.EMPTY;
  });

  if (window && window.MODEL_JS_TEST_MODE) {
    window.ModelError = ModelError;
    window.ModelConfigurator = ModelConfigurator;
    window.Class = Class;
    window.InstancePrototype = InstancePrototype;
  }

  return Model;

})();

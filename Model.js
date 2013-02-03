// TODO Get rid of $.isArray, $.isPlainObject, $.trim and $.extend jQuery sugar.
// TODO Turn Class.attributeNames into an immutable getter.


Model = (function () {

  var MC;



  //
  //
  //

  function ModelError(code, message) {

    // ModelError codes stick to the following convention:
    // - M0** Model constructor errors
    // - M1** Model class method errors
    // - M2** Model prototype method errors
    // - C0** Class constructor errors
    // - C1** Class class method errors
    // - C2** Class prototype method errors
    // - MC1** ModelConfigurator class method errors
    // - MC2** ModelConfigurator prototype method errors

    this.code = code;
    this.message = message;
  }

  ModelError.prototype.toString = function () {
    return this.code + ': ' + this.message;
  }



  //
  //
  //

  function ModelConfigurator(cls) {
    cls._rawAttributes = [];

    // A namespace for complex Class specific validators,
    // like if your domain ends with .dk, your region cannot be Asia.
    cls._validators = {};

    // A namespace for Class specific errCodes returned by Class._validators,
    // like INVALID_REGION_BY_DOMAIN.
    cls.errCodes = {};

    cls._callbacks = {};

    cls.prototype = cls.__proto__ = Class.prototype;

    this.errCodes = cls.errCodes;

    this._cls = cls;
  }

  MC = ModelConfigurator;  // Just a convenience.

  // COVERED!
  MC.prototype.attr = function () {
    var Class = this._cls,
      args = Array.prototype.slice.call(arguments),
      attrDescription = args.shift(),
      m, i,
      attrData = {};

    if (typeof(attrDescription) != 'string') {
      throw new ModelError('MC201',
        "1st argument of a `attr` method should be a string!");
    }

    m = attrDescription.match(/^([a-z]+)(\!?)(\+?)$/i);
    if (!m) {
      throw new ModelError('MC202',
        "The attribute description `"+attrDescription+"` is incorrect!");
    }

    // Check if all supplied arguments after the 1st one are correct validator
    // description.
    for (i = 0; i < args.length; i++) {
      switch (true) {
        case typeof(args[i]) == 'function': break;
        case typeof(args[i]) == 'string' && /^[a-z]+$/i.test(args[i]): break;
        case $.isArray(args[i]) && args[i].length == 2 &&
          typeof(args[i][0]) == 'string' && /^[a-z]+$/i.test(args[i][0]): break;
        default:
          throw new ModelError('MC203',
            "Argument "+(i+1)+" in description of the `"+m[0]+"` "+
            "attribute is not a correct validator!");
        }
    }

    Class._rawAttributes.push({
      name:       m[1],
      idAttr:     m[2] == '!',
      required:   m[3] == '+',
      validators: args
    });
  }

  MC.processRawAttributes = function (rawAttributes) {
    var i, attrName, attr, validators, validatorName,
      attributes = {},
      attributeValidators = {},
      attributeNames = [],
      requiredAttributes = [],
      idAttributes = [],
      idAttr;

    // Remove duplicates in favour of the most recent description.
    for (i = 0; i < rawAttributes.length; i++) {
      attr = rawAttributes[i];
      attributes[attr.name] = attr;
    }

    for (attrName in attributes) {
      attributeNames.push(attrName);
      if (attributes[attrName].required) requiredAttributes.push(attrName);
      if (attributes[attrName].idAttr) idAttributes.push(attrName);
      attributeValidators[attrName] = attributes[attrName].validators;
    }


    if (idAttributes.length > 1) {
      throw new ModelError('MC101',
        "Only one of the described attributes should be marked with "+
        "the exlamation sign as an id attribute! "+
        "But there are "+ idAttributes.length +": "+
         idAttributes.join(',') + ".");
    } else if (idAttributes.length == 1) {
      idAttr = idAttributes[0];
    }

    for (attrName in attributeValidators) {
      var validators = attributeValidators[attrName];
      for (i = 0; i < validators.length; i++) {
        switch (true) {
          case typeof(validators[i]) == 'function': continue; break;
          case $.isArray(validators[i]): validatorName = validators[i][0]; break;
          default: validatorName = validators[i];
        }
        if (!Model._validators[validatorName]) {
          throw new ModelError('MC102',
            "Attributes, when described by name, should be described only with "+
            "existing validators! "+
            "Unknown validator `"+validatorName+"`!");
        }
      }
    }

    if (idAttr && requiredAttributes.indexOf(idAttr) == -1) {
      requiredAttributes.push(idAttr);
    }

    return {
      idAttr: idAttr,
      attributeNames: attributeNames,
      requiredAttributes: requiredAttributes,
      attributeValidators: attributeValidators
    }
  }



  //
  //
  //

  function Class(configuration) {

    var DataFunctionPrototype = {},
      i, attrData,
      configurator;

    function Class() {

      if (this.constructor != Class) {
        throw new ModelError('C001',
          "Model Class instances should be created with keyword `new`!");
      }

      var instance = this,
        persistanceFlag,
        attrName,
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
            "it should be either a boolean persistance flag or "+
            "a data object!");
        }
      }

      else if (arguments.length == 2) {
        if (typeof(arguments[0]) == 'boolean' &&
              $.isPlainObject(arguments[1])) {
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
          "A Model Class constructor should be provided no more "+
          "than 2 arguments!");
      }


      instance._data = {};
      instance._changes = {};
      instance._callbacks = {};

      instance._isPersisted = typeof(persistanceFlag) == 'boolean' ?
        persistanceFlag : !!data[Class.idAttr];

      if (instance._isPersisted && data[Class.idAttr] === undefined) {
        throw new ModelError('C005',
          "instance cannot be explicitly persisted on creation "+
          "if it has no id attribute set!");
      }

      for (attrName in data) {
        if (Class.attributeNames.indexOf(attrName) >= 0) {
          instance._data[attrName] = data[attrName];
        }
      }

      instance._data2 = dataFn = function () {
        if (arguments.length == 1 && arguments[0] === undefined) {
          return instance;
        }
        return $.extend({}, instance._data);
      }

      dataFn.prototype = dataFn.__proto__ = DataFunctionPrototype;
    }

    configurator = new ModelConfigurator(Class);
    configuration.call(configurator, configurator);

    attrData = ModelConfigurator.processRawAttributes(Class._rawAttributes);

    delete Class._rawAttributes;

    Class.idAttr = attrData.idAttr;
    Class.requiredAttributes = attrData.requiredAttributes;
    Class.attributeNames = attrData.attributeNames;
    Class.attributeValidators = attrData.attributeValidators;



    // Extend DataFunctionPrototype with attribute getters and setters.
    for (i = 0; i < Class.attributeNames.length; i++) {
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



  //
  //
  //

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
          "instance.get method should be provided "+
          "valid attribute names only!");
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



  //
  //
  //

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

    var cls = new Class(configuration),
      Mediator;

    // TODO Sanity checks.

    Mediator = new Function;
    Mediator.prototype = InstancePrototype;
    cls.prototype = new Mediator;
    cls.prototype.constructor = cls;

    cls.className = name;
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



  //
  //
  //

  if (window && window.MODEL_JS_TEST_MODE) {
    window.ModelError = ModelError;
    window.ModelConfigurator = ModelConfigurator;
    window.Class = Class;
    window.InstancePrototype = InstancePrototype;
  }

  return Model;

})();

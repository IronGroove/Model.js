// TODO Get rid of $.isArray, $.isPlainObject, $.trim and $.extend jQuery sugar.
// TODO Turn Class.attributeNames into an immutable getter.


Model = (function () {

  var MC;


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
    // - I2** InstancePrototype method errors

    this.code = code;
    this.message = message;
  }

  ModelError.prototype.toString = function () {
    return this.code + ': ' + this.message;
  }



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
    var cls = this._cls,
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

    cls._rawAttributes.push({
      name:       m[1],
      idAttr:     m[2] == '!',
      required:   m[3] == '+',
      validators: args
    });
  }

  // COVERED!
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



  function Class(configuration) {

    var DataFunctionPrototype = {},
      i, attrData,
      configurator;

    function Class() {

      if (this.constructor != Class) {
        throw new ModelError('C001',
          "Instances should be created with keyword `new`!");
      }

      var instance = this,
        cls = this.constructor,
        persistanceFlag,
        attrName,
        data,
        dataEmpty = true,
        dataFn;

      instance._data = {};
      instance._errors = {};
      instance._callbacks = {};
      instance._changes = {};

      // Pretend that instance is not validated, so that it could be.
      instance._changesAfterValidation = true;

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


      for (attrName in data) {
        if (cls.attributeNames.indexOf(attrName) >= 0) {
          instance._data[attrName] = data[attrName];
          dataEmpty = false;
        }
      }

      // Instance tends to be persisted on initialization!
      instance._persisted = 1;

      if (persistanceFlag === undefined) {
        if (cls.idAttr && !data[cls.idAttr]) instance._persisted = 0;
      }

      else if (persistanceFlag) {
        if (cls.idAttr) {
          if (!data[cls.idAttr]) {
            throw new ModelError('C005',
              "instance cannot be explicitly persisted on initialization "+
              "if it has no data for its id attribute!");
          }
        }
      }

      else {
        instance._persisted = 0;
      }

      if (instance._persisted > 0 && dataEmpty) {
        throw new ModelError('C006',
          "instance cannot be persisted on initialization if it has no data!");
      }

      // COVERED!
      instance._data2 = dataFn = function () {
        if (arguments.length == 1 && arguments[0] === undefined) {
          return instance;
        }
        return $.extend({}, instance._data);
      }

      dataFn.prototype = dataFn.__proto__ = DataFunctionPrototype;

      instance._trigger('initialize');
    }

    configurator = new ModelConfigurator(Class);
    configuration.call(configurator, configurator);

    attrData = ModelConfigurator.processRawAttributes(Class._rawAttributes);

    delete Class._rawAttributes;

    Class.idAttr = attrData.idAttr;
    Class.requiredAttributes = attrData.requiredAttributes;
    Class.attributeNames = attrData.attributeNames;
    Class.attributeValidators = attrData.attributeValidators;


    // COVERED!
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


    var Mediator = new Function;
    Mediator.prototype = InstancePrototype;
    Class.prototype = new Mediator;
    Class.prototype.constructor = Class;

    return Class;
  }


  // COVERED!
  Class.prototype.bind = function (eventName, handler) {
    var cls = this;
    if (arguments.length != 2 ||
          typeof(eventName) != 'string' ||
            Model._classEventNames.indexOf(eventName) == -1 ||
              typeof(handler) != 'function') {
      throw new ModelError('C101',
        "Class.bind accepts two arguments: a valid string eventName "+
        "and a function eventHandler! "+
        "Valid event names are: "+Model._classEventNames.join(',')+".");
    }

    if (cls._callbacks[eventName] === undefined) {
      cls._callbacks[eventName] = [];
    }

    cls._callbacks[eventName].push(handler);
  }

  Class.prototype.validate = function () {
    var cls = this, instance, attrName, value;

    if (arguments.length == 0 || arguments.length > 2) {
      throw new ModelError('C102',
        "Class.validate accepts either 1 argument, a model instance "+
        "of same Class, or 2 arguments, a valid string attribute name "+
        "and its a value to validate!");
    }

    else if (arguments.length == 1) {
      instance = arguments[0];

      if (instance.constructor !== cls) {
        throw new ModelError('C103',
          "Provided argument is not an instance of same class! "+
          "("+cls.className+")");
      }

      var errors = {},
        i, attrName, err;

      for (i = 0; i < cls.attributeNames.length; i++) {
        attrName = cls.attributeNames[i];
        err = this.validate(attrName, instance.data[attrName]);
        if (err !== undefined) errors[attrName] = err;
      }

      // If any error, return all.
      for (i in errors) return errors;

      return {};
    }

    else if (arguments.length == 2) {
      attrName = arguments[0];
      value = arguments[1];

      if (this.attributeNames.indexOf(attrName) == -1) {
        throw new ModelError('C104',
          "Class.validate accepts two arguments: a valid string attributeName "+
          "and a value to validate!");
      }

      var validators = cls.attributeValidators[attrName],
        i, err, validator;

      if (value === null || value === undefined) {
        if (cls.requiredAttributes.indexOf(attrName) >= 0) {
          return Model.errCodes.NULL;
        } else {
          return;
        }
      }

      for (i = 0; i < validators.length; i++) {
        validator = validators[i];
        if (typeof(validator) == 'string') {
          err = Model._validators[validator](value);
        } else if ($.isArray(validator)) {
          err = Model._validators[validator[0]](value, validator[1]);
        } else if (typeof(validator) == 'function') {
          err = validator(value);
        }

        if (err !== undefined) {
          return err;
        }
      }
    }
  };



  var InstancePrototype = {};

  // COVERED!
  InstancePrototype.__defineGetter__('data', function () {
    return this._data2;
  });

  // COVERED!
  InstancePrototype.__defineSetter__('data', function (data) {
    if (!$.isPlainObject(data)) {
      throw new ModelError('I201',
        "instance.data= setter accepts plain objects only!");
    }

    var cls = this.constructor,
      instance = this,
      changes = {};

    for (var attrName in data) {
      if (cls.attributeNames.indexOf(attrName) >= 0) {
        if (instance._set(attrName, data[attrName], false) === true) {
          changes[attrName] = data[attrName];
        }
      }
    }

    this._trigger('change', changes);
  });

  // COVERED!
  InstancePrototype.__defineGetter__('isPersisted', function () {
    return this._persisted > 0 && !this.hasChanged;
  });

  // COVERED!
  InstancePrototype.__defineGetter__('isNew', function () {
    // If instance has been persisted once, it is not new.
    return this._persisted == 0;
  });

  // COVERED!
  InstancePrototype.__defineGetter__('hasChanged', function () {
    // If any change, return true.
    for (var k in this._changes) return true;
    return false;
  });

  // COVERED!
  InstancePrototype.get = function (attr) {
    if (!arguments.length) {
      return this.data();
    }

    var cls = this.constructor;

    for (var i = 0; i < arguments.length; i++) {
      if (typeof(arguments[i]) != 'string' ||
            cls.attributeNames.indexOf(arguments[i]) == -1) {
        throw new ModelError('I202',
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

  // COVERED!
  InstancePrototype.set = function (attrName, value) {
    var cls = this.constructor;
    if (typeof(attrName) != 'string' ||
          cls.attributeNames.indexOf(attrName) == -1 ||
            arguments.length != 2) {
      throw new ModelError('I203',
        "instance.set method should be provided two argument and first "+
        "of them should be a valid string attribute name!");
    }
    this._set(attrName, value, false);
  };

  // COVERED!
  InstancePrototype._get = function (attrName) {
    return this._data[attrName];
  }

  // COVERED!
  InstancePrototype._set = function (attrName, value, triggerChange) {
    var change = {};

    if (this._changesAfterValidation === true) this._changesAfterValidation = {};
    this._changesAfterValidation[attrName] = value;

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
      if (triggerChange !== false) {
        change[attrName] = value;
        this._trigger('change', change);
      }
      return true;
    }
    return false;
  }

  // COVERED!
  InstancePrototype.bind = function (eventName, handler) {
    if (typeof(eventName) != 'string' ||
          Model._instanceEventNames.indexOf(eventName) == -1 ||
            typeof(handler) != 'function') {
      throw new ModelError('I204',
        "instance.bind method should be provided with a valid "+
        "string eventName and a function handler!");
    }

    if (this._callbacks[eventName] === undefined) {
      this._callbacks[eventName] = [];
    }

    this._callbacks[eventName].push(handler);
  }

  // COVERED!
  InstancePrototype._trigger = function () {
    var i,
      cls = this.constructor,
      args = Array.prototype.slice.call(arguments),
      eventName = args.shift();

    if (typeof(eventName) != 'string' ||
         !(Model._classEventNames.indexOf(eventName) >= 0 ||
           Model._instanceEventNames.indexOf(eventName)  >= 0 )) {
      throw new ModelError('I205',
        "instance._trigger should be provided a valid event name!");
    }

    if (cls._callbacks[eventName]) {
      for (i = 0; i < cls._callbacks[eventName].length; i++) {
        cls._callbacks[eventName][i].apply(this, args);
      }
    }

    if (this._callbacks[eventName]) {
      for (i = 0; i < this._callbacks[eventName].length; i++) {
        this._callbacks[eventName][i].apply(this, args);
      }
    }
  }

  // COVERED!
  InstancePrototype.__defineGetter__('_hasChangedAfterValidation', function () {
    if (this._changesAfterValidation === true) return true;
    for (var k in this._changesAfterValidation) return true;
    return false;
  });

  // COVERED!
  InstancePrototype.__defineGetter__('errors', function () {
    if (this._hasChangedAfterValidation) {
      this._errors = this.constructor.validate(this);
      this._changesAfterValidation = {};
    }
    return this._errors;
  });

  // COVERED!
  InstancePrototype.__defineGetter__('isValid', function () {
    for (var k in this.errors) return false;
    return true;
  });

  // COVERED!
  InstancePrototype._persist = function () {
    if (this.hasChanged) {
      this._changes = {};
      this._changesAfterValidation = {};
      this._trigger('persist');
    }
  };



  // COVERED!
  function Model(name, configuration) {
    if (this.constructor != Model) {
      throw new ModelError('M001',
        "New models should be created with keyword `new`!");
    } else {
      // TODO Return Model found by name.
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

    var cls = new Class(configuration);

    // TODO Sanity checks.

    cls.className = name;
    Model._classes[name] = cls;

    return cls;
  }


  // COVERED!
  Model._classes = {};
  Model._validators = {};
  Model._classEventNames = 'initialize change'.split(' ');
  Model._instanceEventNames = 'change persist'.split(' ');

  // COVERED!
  Model.errCodes = {};
  Model.errCodes.WRONG_TYPE = 'wrongtype';
  Model.errCodes.NULL = 'null';
  Model.errCodes.EMPTY = 'empty';
  Model.errCodes.NOT_IN = 'notin'

  // COVERED!
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


  // COVERED!
  Model.registerValidator('number', function (value) {
    if (typeof(value) != 'number') return Model.errCodes.WRONG_TYPE;
  });

  // COVERED!
  Model.registerValidator('string', function (value) {
    if (typeof(value) != 'string') return Model.errCodes.WRONG_TYPE;
  });

  // COVERED!
  Model.registerValidator('boolean', function (value) {
    if (typeof(value) != 'boolean') return Model.errCodes.WRONG_TYPE;
  });

  // COVERED!
  Model.registerValidator('nonnull', function (value) {
    if (value === null) return Model.errCodes.NULL;
  });

  // COVERED!
  Model.registerValidator('nonempty', function (value) {
    if (typeof(value) != 'string') return;
    if (value.length == 0) return Model.errCodes.EMPTY;
  });

  // COVERED!
  Model.registerValidator('in', function (value, values) {
    if (values.indexOf(value) == -1) return Model.errCodes.NOT_IN;
  });


  // Expose private functions for testing.

  if (window && window.MODEL_JS_TEST_MODE) {
    window.ModelError = ModelError;
    window.ModelConfigurator = ModelConfigurator;
    window.Class = Class;
    window.InstancePrototype = InstancePrototype;
  }

  return Model;

})();

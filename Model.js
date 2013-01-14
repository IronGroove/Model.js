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
			throw new ModelError('M01', 'new Model classes should be created with keyword `new`!');
		}

		if (typeof name != 'string') {
			throw new ModelError('M02', '`new Model` expects its 1st argument to be a string name of a new class!');
		}

		if (Model.classes[name]) {
			throw new ModelError('M07', 'models class with that name already exists!');
		}

		if (!$.isPlainObject(options)) {
			throw new ModelError('M03', '`new Model` expects its 2nd argument to be an options object!');
		}

		if (!options.attributes || options.attributes.constructor.name !== 'Array' || options.attributes.length === 0) {
			throw new ModelError('M04', "new model's options should contain nonempty attributes array!");
		}

		var i, j,
		  attrNotation,
			attrDescribed,
		  attributesDescribed = [],
		  attributeNames = [];

		for (i = 0; i < options.attributes.length; i++) {
			attrNotation = options.attributes[i];
		  attrDescribed = Model._parseAttributeNotation(attrNotation);
			if (attrDescribed === false) {
				throw new ModelError('M05', "attributes should be valid notation strings!");
			}
			attributesDescribed.push( attrDescribed );
		}

		for (i = 0; i < attributesDescribed.length; i++) {
			attrDescribed = attributesDescribed[i];
			for (j = 0; j < attrDescribed.validators.length; j++) {
				if (!Model._validators[attrDescribed.validators[j]]) {
					throw new ModelError('M06', "attributes should be described with existing validators!");
				}
			}
		}


		function Class() {
      if (this.constructor != Class) {
        throw new ModelError('C01', "Class instances should be created with keyword `new`");
      }

      var obj = this, data;

      if (arguments[0] !== undefined && !$.isPlainObject(arguments[0])) {
        throw new ModelError('C02', "Class instance should receive data object on creation");
      }

      data = arguments[0] || {};
      obj._data = {};

      for (var attrName in data) {
        if (Class.attributes.indexOf(attrName) >= 0) obj._data[attrName] = data[attrName];
      }
		}

		Class.className = name;

		Class.attributes = [];
		Class._validators = {};

		for (i = 0; i < attributesDescribed.length; i++) {
		  Class.attributes.push( attributesDescribed[i].attrName );
		  Class._validators[ attributesDescribed[i].attrName ] = $.extend([], attributesDescribed[i].validators );
		}

		Class.idAttr = Class.attributes[0];

    Class.prototype.__defineGetter__('isNew', function () {
      return this._data[ this.constructor.idAttr ] === undefined;
    });

		Class.prototype.get = function (attr) {
      if (!arguments.length) {
        return $.extend({}, this._data);
      }

      var i, attrName, attributes = [], data = {};

      for (i = 0; i < arguments.length; i++) {
        attrName = arguments[i];
        //console.log(attrName, typeof(attrName), Class.attributes);
        if (typeof(attrName) != 'string' || Class.attributes.indexOf(attrName) == -1) {
          throw new ModelError('P01', "Get method should be provided valid attribute names only");
        }
        attributes.push(attrName);
      }

      if (attributes.length == 1) {
        return this._data[ attributes[0] ];
      } else {
        for (i = 0; i < attributes.length; i++) {
          attrName = attributes[i];
          data[ attrName ] = this._data[ attrName ];
        }
        return data;
      }
    };

		Class.prototype.set = function (attrName, value) {
      if (typeof(attrName) != 'string' || Class.attributes.indexOf(attrName) == -1 || arguments.length != 2) {
        throw new ModelError('P02', "Set method should be provided two argument and first of them should be a valid string attribute name");
      }
      this._data[attrName] = value;
    };

		Model.classes[name] = Class;

		return Class;
	}

	Model._validators = {};

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

	Model.registerValidator = function (name, validatorFn) {
		if (typeof name !== 'string'  ||  !name.match(/^[a-zA-Z]+$/)) {
			throw new ModelError('MrV01', '`Model.registerValidator` expects its 1st argument to be a [a-zA-Z]+ string validator name!');
		}

		if (typeof validatorFn !== 'function') {
			throw new ModelError('MrV02', '`Model.registerValidator` expects its 2nd argument to be actual validator function!');
		}

		if (!!Model._validators[name]) {
			throw new ModelError('MrV03', 'validator with that name already exists!');
		}

		Model._validators[name] = validatorFn;
	};

	Model.classes = {};

	Model.errCodes = {};
	Model.errCodes.WRONG_TYPE = 'wrongtype';
	Model.errCodes.NULL = 'null';
	Model.errCodes.EMPTY = 'empty';

	Model.registerValidator('number', function (value) {
		if (typeof(value) !== 'number') return Model.errCodes.WRONG_TYPE;
	});

	Model.registerValidator('string', function (value) {
		if (typeof(value) !== 'string') return Model.errCodes.WRONG_TYPE;
	});

	Model.registerValidator('boolean', function (value) {
		if (typeof(value) !== 'boolean') return Model.errCodes.WRONG_TYPE;
	});

	Model.registerValidator('nonnull', function (value) {
		if (value === null) return Model.errCodes.NULL;
	});

	Model.registerValidator('nonempty', function (value) {
		if (typeof(value) !== 'string') return;
		if (value === '') return Model.errCodes.EMPTY;
	});

	return Model;

})();








/*
function Model() {

  function Class() {
    if (this.constructor != Class) {
      return Model.find.apply(Class, arguments);
    }

    var obj = this,
      data = arguments[0] || {};

    obj._errors = [];
    obj._data = {};
    obj._changed = {};

    _(data).each(function (value, attr) {
      if (_(Class._attributes).include(attr)) obj._data[attr] = value;
    });

    if (obj._data[ Class.idAttr ]) this._register();
  }

  Class.errCodes = {};  // Should be filled with custom error codes.
  Class._byId = {};
  Class._validators = {};


  Class.validate = function (attr, fn) {
    Model.registerValidator.apply(this, arguments);
    return this;
  }

//  Class.method('_register', function () {
//    // NOTE _register is not checking whether it can actually register.
//    Class._byId[this._id] = this;
//  });

//  Class.method('_unregister', function () {
//    delete Model._byId[this._id];
//  });

  Class.getter('isValid', function () {
    if (this.hasChanged) this.validate();
    return _.size(this._errors) === 0;
  });

  Class.getter('errors', function () {
    if (this.hasChanged) this.validate();
    return this._errors;
  });

  Class.getter('hasChanged', function () {
    return _.size(this._changed) > 0;
  });

  Class.getter('dataCopy', function () {
    return $.extend(true, {}, this._data);
  });

  Class.method('validate', function () {
    this._errors = Model.validate(this);
  });

  Class.method('revert', function () {
    var obj = this,
      changes = $.extend(true, {}, obj._changed);
    $.extend(true, obj._data, obj.changed);
    obj._changed = {};
    $(obj).trigger('revert', changes);
  });

  Class.method('remain', function () {
    var obj = this,
      changes = $.extend(true, {}, obj._changed);
    obj._changed = {};
    $(obj).trigger('changed', changes);
  });

  Class.method('destroy', function () {
    var obj = this;
    delete Model._byCid[obj.cid];
    delete Class._byId[obj._id];
    $(obj).trigger('destroy');
  });

  Class.getter('_id', function () {
    return this._data[Class.idAttr];
  });

  Class.setter('_id', function (value) {
    return this._data[Class.idAttr] = value;
  });

  Class.getter('isNew', function () {
    return !this._id;
  });

  _(Class._attributes).each(function (attr) {
    Class.getter(attr, function () {
      return this._data[attr];
    });
    Class.setter(attr, function (value) {
      if (this._data[attr] != value && this._changed[attr] === undefined) {
        this._changed[attr] = this._data[attr];
      }
      this._data[attr] = value;
    });
  });

  _(validators).each(function (validatorNames, attr) {
    _(validatorNames).each(function (name) {
      Class.validate(attr, Model.validators[name]);
    });
  });

  return Class;
}

Model.reservedWords = "cid isNew isValid errors validate revert dataCopy".split(" ");

Model.find = function () {
  var cls = this,
    obj, id, cid,
    arg0 = arguments[0],
    shout = !!arguments[1];

  if (arguments.length == 0) {
    return cls.all();
  }

  if (typeof(arg0) === 'string' && arg0[0] === '#') {
    cid = arg0;
    obj = Model._byCid[cid];
  } else if (typeof(arg0) === 'number' || typeof(arg0) === 'string') {
    id = arg0;
    obj = cls._byId[id];
  } else {
    obj = null;
  }

  if (obj === undefined && shout) {
    if (id)
      throw "No `"+type+"` object found by id `"+id+"`!";
    else if (cid)
      throw "No `"+type+"` object found by cid `"+cid+"`!";
  }

  return obj;
}

Model.validate = function (obj) {
  var cls = obj.constructor,
    isNew = obj.isNew,
    errors = [];

  _(cls._attributes).each(function (attr) {
    if (!cls._validators[attr]) return;
    if (attr == cls.idAttr && isNew) return;
    _(cls._validators[attr]).each(function (validator) {
      var err = validator(obj._data[attr]);
      if (err) errors.push([ attr, err ]);
    });
  });

  if (cls._validators[null]) {
    _(cls._validators[null]).each(function (validator) {
      var err = validator(obj._data);
      if (err) errors.push([ null, err ]);
    });
  }

  return errors;
}


*/

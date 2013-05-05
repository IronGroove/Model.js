# v0.1 — May 3, 2013

Private utility functions

- isArray
- extend
- isPlainObject

ModelError(code, message)

ModelConfigurator

- ModelConfigurator#attr(attrName[, \*validators… ])
- ModelConfigurator.processRawAttributes(rawAttributes)

Class(configurationFn)

- Class.isArray
- Class.requiredAttributes
- Class.attributeNames
- Class.attributeValidators
- Class#bind(eventName, handler)
- Class#validate(instance)
- Class#validate(attrName, value)
- instance.\_data
- instance.\_data2
- instance.\_errors
- instance.\_callbacks
- instance.\_changes
- instance.\_changesAfterValidation
- instance.\_persisted
- instance.isNew
- instance.isPersisted
- instance.\_get(attrName)
- instance.\_set(attrName, value, triggerChange)
- instance.get()
- instance.get(attrName[, attrName, … ])
- instance.set({…})
- instance.set(attrName, value)
- instance.data()
- instance.data = {…}
- instance.data[attrName]
- instance.data[attrName] =
- instance.hasChanged
- instance.\_persist()
- instance.revert()
- instance.bind(eventName, handler)
- instance.\_trigger(eventName[, \*argsForHandler… ]);
- instance.\_hasChangedAfterValidation
- instance.errors
- instance.isValid

Model(name, configurationFn)

- Model.errCodes
- Model.registerValidator

Registered validators

- string
- number
- boolean
- nonnull
- nonempty
- in

Events

- initialize
- change (changes)
- persist
- revert

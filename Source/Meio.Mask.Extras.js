/*
---

description: Extra functionality for Meio.Mask plugin. Like String.meiomask that masks a string and Element.meiomask which is a convinience method for setting the masks.

authors:
 - Fábio Miranda Costa

requires:
 - Meio.Mask

license: MIT-style license

provides: [Meio.Mask.Extras]

...
*/

(function(){

	var meiomask = 'meiomask';
	var dummyInput = new Element('input', {'type': 'text'});
	
	var upperCamelize = function(str){
		return str.camelCase().capitalize();
	};
	
	var getClassOptions = function(args){
		args = Array.link(args, {mask: String.type, type: String.type, options: Object.type, klass: Class.type});
		var classPath = [];
		if (args.mask) classPath = args.mask.split('.');
		var klass = args.klass || (classPath[1] ? Meio.Mask[upperCamelize(classPath[0])][upperCamelize(classPath[1])] : Meio.Mask[upperCamelize(args.type)][upperCamelize(args.mask)]),
		    options = args.options || {};
		return {klass: klass, options: options};
	};
	
	var executeFunction = function(functionName, args){
		var co = getClassOptions(args);
		dummyInput.set('value', '');
		return new co.klass(dummyInput, co.options)[functionName](this);
	};

	String.implement({
		meiomask: function(){
			return executeFunction.call(this, 'mask', arguments);
		},
		meiounmask: function(){
			return executeFunction.call(this, 'unmask', arguments);
		}
	});

	Element.Properties.meiomask = {
		set: function(){
			var args = getClassOptions(arguments);
			return this.store(meiomask, new args.klass(this, args.options));
		},
		// returns the mask object
		get: function(){
			return this.retrieve(meiomask);
		},
		// removes the mask from this input but maintain the mask object stored at its table
		erase: function(){
			var mask = this.retrieve(meiomask);
			if (mask) mask.remove();
			return this;
		}
	};
	
	Element.Properties[meiomask + ':value'] = {
		// sets the value but first it applyes the mask (if theres any)
		set: function(value){
			var mask = this.retrieve(meiomask);
			if (mask) value = mask.mask(value);
			return this.set('value', value);
		},
		
		// gets the unmasked value
		get: function(){
			var mask = this.retrieve(meiomask);
			var value = this.get('value');
			return (mask) ? mask.unmask(value) : value;
		}
	};

	// fix for maxlength property
	var maxLength = document.createElement('input').getAttribute('maxLength');
	if (maxLength != null) Element.Properties.maxlength = Element.Properties.maxLength = {
		get: function(){
			var maxlength = this.getAttribute('maxLength');
			return maxlength == maxLength ? null : maxlength;
		}
	};
	
	Element.implement({
		meiomask: function(mask, type, options){
			return this.set(meiomask, mask, type, options);
		}
	});

})();

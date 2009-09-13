	
	
	Meio.Mask = new Class({

		Implements: [Options, Events],
		
		eventsToBind: ['focus', 'blur', 'keydown', 'keypress', 'paste'],

		options: {
			
			selectOnFocus: true,
			autoTab: false
			
			//onInvalid: $empty,
			//onValid: $empty,
			//onOverflow: $empty
			
			//REVERSE MASK OPTIONS
			//signal: false,
			//setSize: false
		},

		initialize: function(el, options){
			this.element = $(el);
			if(this.element.get('tag') !== 'input' || this.element.get('type') !== 'text') return;
			this.setup(options);
		},
        
		setup: function(options){
			this.setOptions(options);
			if(this.options.mask){
				if(this.element.retrieve('meiomask')) this.remove();
				var elementValue = this.element.get('value');
				if(elementValue !== ''){
					var elValue = elementValue.meiomask(this.constructor, this.options);
					this.element.set('value', elValue).defaultValue = elValue;
				}
				this.ignore = false;
				this.masklength = this.element.get('maxlength');
				this.maskArray = this.options.mask.split('');
	    		this.eventsToBind.each(function(evt){
	    			this.element.addEvent(evt, this._onMask.bindWithEvent(this, this['_' + evt]));
	    		}, this);
				this.element.store('meiomask', this).erase('maxlength');
			}
			return this;
		},
		
		remove: function(){
			var mask = this.element.retrieve('meiomask');
			if(mask){
				var maxLength = mask.options.maxlength;
				if(maxLength !== null) this.element.set('maxlength', maxLength);
				mask.eventsToBind.each(function(evt){
					this.element.removeEvent(evt, this[evt + 'Event']);
				}, mask);
			}
			return this;
		},
		
		_onMask: function(e, func){
			if(this.element.get('readonly')) return true;
			var o = {};
			o.range = this.element.getRange();
			o.isSelection = (o.range.start !== o.range.end);
			// 8==backspace && 46==delete && 127==iphone's delete (i mean backspace)
			o.isDelKey = (e.code == 46);
			o.isBksKey = (e.code == 8 || (Browser.Platform.ipod && e.code == 127));
			o.isRemoveKey = (o.isBksKey || o.isDelKey);
			func.call(this, e, o);
			return true;
		},
    
	    _keydown: function(e, o){
			this.ignore = (e.code in Meio.Mask.ignoreKeys);
			if(this.ignore){
	    		// var rep = Meio.Mask.ignoreKeys[e.code];
				// no more representation of the keys yet... (since this is not so used or usefull you know..., im thinking about that)
				this.fireEvent('valid', [this.element, e.code]);
	    	}
			(Browser.Platform.ipod
			|| (Meio.Mask.onlyKeyDownRepeat && o.isRemoveKey))? this._keypress(e, o): true;
	    },
        
        _focus: function(e, o){
            if(this.options.selectOnFocus) this.element.select();
        },
    
		testEntry: function(index, _char){
			var maskArray = this.maskArray,
				rule = Meio.Mask.rules[maskArray[index]],
				ret = (rule && rule.regex.test(_char));
			return (rule.check && ret)? rule.check(this.element.get('value'), index, _char): ret;
		},

	    testEvents: function(index, _char, code, isRemoveKey){
	    	var maskArray = this.maskArray,
			    rule = Meio.Mask.rules[maskArray[index]],
			    returnFromTestEntry;
			if(!isRemoveKey){
				if(!rule){
		    		//console.log('overflow');
					this.fireEvent('overflow', [this.element, code, _char]);
		    		return false;
		    	}
		    	else if(!(returnFromTestEntry = this.testEntry(index, _char))){
					//console.log('invalid');
		    		this.fireEvent('invalid', [this.element, code, _char]);
		    		return false;
		    	}
			}
	    	//console.log('valid');
			this.fireEvent('valid', [this.element, code, _char]);
			return returnFromTestEntry || true;
	    },
		
		setSize: function(){
			if(!this.element.get('size')) this.element.set('size', this.maskArray.length);
		},
		
		isFixedChar: function(_char){
		    return !Meio.Mask.matchRules.contains(_char);
		}
	});
	
	Meio.Mask.extend({

	    matchRules: '',
	    
	    rulesRegex: new RegExp(),
		
		rules: {},
		
		setRule: function(ruleKey, properties){
			this.setRules({ruleKey: properties});
		},
	
		setRules: function(rulesObj){
		    $extend(this.rules, rulesObj);
		    var rulesKeys = [];
			for(rule in rulesObj) rulesKeys.push(rule);
    		this.matchRules += rulesKeys.join('');
    		this.recompileRulesRegex();
		},
	
		removeRule: function(rule){
			delete this.rules[rule];
			this.matchRules = this.matchRules.replace(rule, '');
			this.recompileRulesRegex();
		},
	
		removeRules: function(){
			var rulesToRemove = Array.flatten(arguments);
			for(var i=rulesToRemove.length; i--;) this.removeRule(rulesToRemove[i]);
		},
		
		recompileRulesRegex: function(){
		    this.rulesRegex.compile('[' + this.matchRules.escapeRegExp() + ']', 'g');
		},
		
		createMasks: function(type, masks){
		    type = type.capitalize();
		    for(mask in masks){
		        Meio.Mask[type][mask.camelCase().capitalize()] = new Class({
    		        Extends: Meio.Mask[type],
    		        options: masks[mask]
    		    });
		    }
		},
		
		// Christoph Pojer's (zilenCe) idea http://cpojer.net/
		// adapted to MeioMask
		upTo: function(number){
		    number = String(number);
		    return function(value, index, _char){
		        if(value.charAt(index-1) == number[0])
    		        return (_char<=number[1]);
    		    return true;
		    };
		},
		
		// http://unixpapa.com/js/key.html
		// if only the keydown auto-repeats
		// if you have a better implementation of this detection tell me
        onlyKeyDownRepeat: (Browser.Engine.trident || (Browser.Engine.webkit && Browser.Engine.version >= 525))
		
	}).extend(function(){
	    var ignoreKeys;
        var desktopIgnoreKeys = {
    		//8: 'backspace',
    		9 		: 'tab',
    		13      : 'enter',
    		16 	    : 'shift',
    		17 	    : 'control',
    		18 	    : 'alt',
    		27 	    : 'esc',
    		33	    : 'page up',
    		34 	    : 'page down',
    		35 	    : 'end',
    		36 	    : 'home',
    		37 	    : 'left',
    		38 	    : 'up',
    		39 	    : 'right',
    		40 	    : 'down',
    		45 	    : 'insert',
    		//46: 'delete',
    		224  	: 'command'
    	},
    	iphoneIgnoreKeys = {
    		10		: 'go'
    		//127: 'delete'
    	};
    	
    	if(Browser.Platform.ipod){
    	    ignoreKeys = iphoneIgnoreKeys;
    	}
    	else{
    	    // f1, f2, f3 ... f12
            for(var i=1; i<=12; i++) desktopIgnoreKeys[111 + i] = 'f' + i;
            ignoreKeys = desktopIgnoreKeys; 
    	}
        return {ignoreKeys: ignoreKeys};
    }())
    .setRules((function(){
	    var rules = {
			'z': {regex: /[a-z]/},
			'Z': {regex: /[A-Z]/},
			'a': {regex: /[a-zA-Z]/},
			'*': {regex: /[0-9a-zA-Z]/},
			'@': {regex: /[0-9a-zA-ZçáàãâéèêíìóòõôúùüñÇÁÀÃÂÉÈÊÍÌÓÒÕÔÚÙÜÑ]/}, //i doenst work here
			//its included just to exemplify how to use it, its used on the time mask
			'h': {regex: /[0-9]/, check: Meio.Mask.upTo(23)},
			'd': {regex: /[0-9]/, check: Meio.Mask.upTo(31)},
			'm': {regex: /[0-9]/, check: Meio.Mask.upTo(12)}
		};
		for(var i=0; i<=9; i++) rules[i] = {regex: new RegExp('[0-' + i + ']')};
		return rules;
    })());
    

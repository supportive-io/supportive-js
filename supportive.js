( function ( window, undefined ) { 'use strict';

var HttpRequest			= window. XMLHttpRequest,
	encodeURIComponent	= window. encodeURIComponent,
	orignalSupportive	= window. supportive;

/*
	Helpers
*/
var _ = {

	each : function ( list, iterator ) {

		if ( ! list ) return list;

		if ( 'length' in list ) {

			if ( Array. prototype. forEach ) return Array. prototype. forEach. call ( list, iterator, list );

			for ( var i = 0; i < list. length; i++ ) iterator. call ( list, list [ i ], i, list );
		}
		else {

			for ( var key in list ) {

				if ( list. hasOwnProperty ( key ) ) iterator. call ( list, list [ key ], key, list );
			}
		}

		return list;
	},

	filter : function ( list, iterator ) {

		var filtered_list = [  ];

		if ( Array. prototype. filter ) return Array. prototype. filter. call ( list, iterator );

		_. each ( list, function ( value, i ) {

			var keep_value = iterator. call ( list, value, i, list );

			if ( keep_value ) filtered_list. push ( value );
		} );

		return filtered_list;
	},

	extend : function ( target, copy_from ) {

		for ( var key in copy_from ) {

			if ( copy_from. hasOwnProperty ( key ) ) target [ key ] = copy_from [ key ];
		}

		return target;
	},

	isEqual : function ( object_1, object_2 ) {

		if ( ! object_1 || ! object_2 ) return false;

		for ( var key in object_1 ) {

			if ( object_2 [ key ] !== object_1 [ key ] ) return false; 
		}

		for ( var key in object_2 ) {

			if ( object_1 [ key ] !== object_2 [ key ] ) return false;
		}

		return true;
	},

	clone : function ( target ) {

		return _. extend ( {  }, target );
	},
	
	bind : function ( target, fn ) {

		return function (  ) {

			return fn. apply ( target, arguments );
		}
	},

	fire : function ( fn ) {

		var args = Array. prototype. slice. call ( arguments, 1 );

		if ( typeof fn === 'function' ) fn. apply ( window, args );
	},

	guid : function (  ) {

		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'. replace ( /[xy]/g , function ( character ) {
				
				var random_num	= Math. random() * 16 | 0,
					value		= character == 'x' ? random_num : ( random_num & 0x3 | 0x8 );
				
				return value. toString( 16 );
		} );
	}

};

/*
	HTTP Request handler
*/
function request ( options, done ) {

	var url				= options. url,
		method			= options. method. toUpperCase(),
		headers			= options. headers	|| {  },
		query_params	= method === 'GET' ? options. data : options. query,
		json_payload	= JSON. stringify ( options. data ),		
		query			= [  ],
		http_request	= new XMLHttpRequest();

	_. each ( query_params, function ( value, param ) {

		query. push ( encodeURIComponent ( param ) + '=' + encodeURIComponent ( value ) );
	} );

	if ( query. length ) url += '?' + query. join ( '&' );

	http_request. open ( method, url );

	http_request. setRequestHeader ( 'Content-Type', 'application/json' );

	_. each ( headers, function ( value, header ) {

		http_request. setRequestHeader ( header, value );
	} );

	http_request. responseType			= 'json';
	http_request. onreadystatechange	= request. handleResponse ( done );

	http_request. send ( json_payload );
}

request. handleResponse = function ( done ) {

	return function (  ) {
		
		var error		= {  };

		if		( this. readyState !== 4 )		return;
		else if	( typeof done !== 'function' )	return;

		if ( this. status > 300 ) {

			error. request 	= this;
			error. status	= this. status;
			error. text		= this. statusText;
			error. message	= this. response;
			
			done ( error, null );
		}
		else {

			done ( null, this. response ); 
		}
	}
};


/*
	Events Class
*/
function Events ( context ) {

	this. events	= {  },
	this. context	= context || this;

	return this;
}

Events. addTo = function ( context ) {

	var events = new this ( context );

	context. listeners	= _. bind ( events, events. listeners );
	context. trigger	= _. bind ( events, events. trigger );
	context. on			= _. bind ( events, events. on );
	context. once		= _. bind ( events, events. once );
	context. off		= _. bind ( events, events. off );
	context. proxy		= _. bind ( events, events. proxy );

	return events;
};

Events. prototype = {

	listeners : function (  ) {

		return this.events;
	},

	trigger : function ( event_name ) {

		var context			= this. context || this,
			event_handlers	= this. events [ event_name ],
			args;

		if ( ! event_handlers ) return;

		args = Array. prototype. slice. call ( arguments, 1 );

		_. each ( event_handlers, function ( handler ) {

			handler. apply ( context, args );
		} );

		if ( event_name !== '*' ) this. trigger ( '*', arguments );

		return context;
	},

	on : function ( event_name, handler ) {

		var events			= this. events,
			event_handlers	= events [ event_name ];

		if ( typeof handler !== 'function' ) throw new Error ( 'An event handler must be passed.' );

		if ( ! event_handlers ) event_handlers = events [ event_name ] = [  ];

		event_handlers. push ( handler );

		return this. context || this;
	},

	once : function ( event_name, handler ) {

		var self = this;

		function once (  ) {

			handler. apply ( this, arguments );

			self. off ( event_name, once );
		}

		this. on ( event_name, once );

		return this. context || this;
	},

	off : function ( event_name, handler ) {

		var events			= this. events,
			event_handlers	= events [ event_name ];

		if		( ! event_name )		return Boolean ( this. events = {  } );
		else if	( ! event_handlers )	return false;

		if ( handler ) {

			for ( var i = 0; i < event_handlers. length; i++ ) {

				var fn = event_handlers [ i ];

				if ( fn === handler )  {

					event_handlers. splice ( i, 1 );
					return true;
				}
			}

			return false;
		}
		else {

			event_handlers. length = 0;

			return true;
		}
	}

};

/*
	Model Class
*/
function Model ( attributes, config ) {

	attributes = attributes || {  };

	this. id			= attributes. id || null;
	this. cid			= _. guid();
	this. destroyed		= false;
	this. attributes	= {  };
	this. config		= _. extend ( {  }, config );

	this. set ( attributes );

	Events. addTo ( this );

	return this;
};

Model. prototype = {

	constructor : Model,

	url : function (  ) {

		var is_new		= this. isNew(),
			config		= this. config,
			endpoint	= config. collection ? config. collection. url() : config. endpoint;
			
		return is_new ? endpoint : endpoint + ( this. id || '' );
	},

	isNew : function (  ) {

		return ! this. id;
	},

	get : function ( property ) {

		var value = this. attributes [ property ];

		/* Helps track changes on shallow nested objects */
		if ( typeof value === 'object' )	return _. clone ( value );
		else								return value;
	},

	set : function ( property, value ) {

		var self				= this,
			changed				= false,
			new_attributes		= {  },
			changed_attributes	= {  };

		if ( self. destroyed ) return false;

		if ( typeof property !== 'object' )	new_attributes [ property ]	= value;
		else								new_attributes				= property;

		_. each ( new_attributes, function ( value, property ) {

			var changed_value = self. _set ( property, value );

			if ( changed_value === undefined ) return;

			changed							= true;
			changed_attributes [ property ]	= changed_value;
		} );

		if ( changed ) self. trigger ( 'change', self, changed_attributes );

		return changed ? changed_attributes : false;
	},

	_set : function ( property, value ) {

		var attributes		= this. attributes,
			current_value	= attributes [ property ];
 
		if ( current_value === value ) return undefined;

		if ( typeof value === 'object' ) {
			
			if ( _. isEqual ( value, current_value ) ) return undefined;
		}

		if ( property === 'id' ) this. id = value;

		attributes [ property ] = value;

		this. trigger ( 'change:' + property, this, value, current_value );

		return { old_value : current_value, new_value : value };
	},

	save : function ( attributes, done ) {

		var self		= this,
			is_new		= self. isNew(),
			destroyed	= self. destroyed,
			request		= {  };

		if ( destroyed ) return _. fire ( done, 'Cannot save a model that has been deleted' );

		if ( typeof attributes === 'function' )	done = attributes;
		else									this. set ( attributes );

		request. url		= self. url();
		request. method		= is_new ? 'post' : 'put';
		request. data		= self;

		self. sync ( request, self. config, function ( error, attributes ) {

			if ( error ) return _. fire ( done, error );

			self. set ( attributes );

			self. trigger ( 'sync', this );

			_. fire ( done, null, self );
		} );

		return this;
	},

	fetch : function ( done ) {

		var self		= this,
			is_new		= self. isNew(),
			destroyed	= self. destroyed,
			request		= {  };

		if		( is_new )		return _. fire ( done, 'Cannot fetch a model that has no `id`.' );
		else if	( destroyed )	return _. fire ( done, 'Cannot fetch a model that has been deleted' );

		request. url		= self. url();
		request. method		= 'get';

		self. sync ( request, self.config, function ( error, done ) {

			if ( error ) return _. fire ( done, error );

			self. set ( attributes );

			this. trigger ( 'sync', this );

			_. fire ( done, null, self );
		} );

		return this;
	},

	destroy : function ( done ) {

		var self		= this,
			is_new		= self. isNew(),
			attributes	= self. attributes,
			request		= {  };

		if ( is_new ) return _. fire ( done, 'Cannot delete a model that has no `id`.' );

		request. url		= self. url();
		request. method		= 'delete';
		request. data		= self;

		self. sync ( request, self. config, function ( error ) {

			if ( error ) return _. fire ( done, error );

			for ( key in attributes ) delete attributes [ key ];

			self. destroyed = true;

			self. trigger ( 'destroy', self );

			self. off();

			_. fire ( done, null, self );
		} );

		return this;
	},

	toJSON : function (  ) {

		return _. clone ( this. attributes );
	},

	sync : function ( request_options, config, done ) {

		request ( request_options, done );
	},
};

/*
	Collection Class
*/
function Collection ( models, config ) {

	this. length		= 0;
	this. config		= _. extend ( { Model : Model }, config );

	this. buildIndexes();

	if ( models ) this. add ( models );

	Events. addTo ( this );

	return this;
}

Collection. prototype = {

	constructor	: Collection,
	length		: 0,

	splice : function (  ) {

		var result = Array. prototype. splice. apply ( this, arguments );

		this. buildIndexes();

		return result;
	},

	push : function ( model ) {

		var length = Array. prototype. push. call ( this, model );

		this. _addIndex ( model, length - 1 );

		return length;
	},

	pop : function (  ) {

		var model = Array. prototype. pop. call ( this );

		if ( model ) this. _removeIndex ( model );

		return model;
	},

	each : function ( iterator ) {

		return _. each ( this, iterator );
	},

	filter : function ( iterator ) {

		return _. filter ( this, iterator );
	},

	buildIndexes : function (  ) {

		this. indexes = {
							id_to_cid		: {  },
							cid_to_index	: {  }
						};

		this. each ( function ( model, index ) {

			this. _addIndex ( model, index );
		} );

		return this;
	},

	_addIndex : function ( model, index ) {

		var indexes			= this. indexes,
			id				= model. id,
			cid				= model. cid,
			id_to_cid		= indexes. id_to_cid,
			cid_to_index	= indexes. cid_to_index;

		this. _removeIndex ( model );

		if ( id ) id_to_cid [ id ] = cid;

		cid_to_index [ cid ] = index; 
	},

	_removeIndex : function ( model ) {

		var indexes			= this. indexes,
			id_to_cid		= indexes. id_to_cid,
			cid_to_index	= indexes. cid_to_index;

		delete id_to_cid [ model. id ];
		delete cid_to_index [ model. cid ];
	},

	reset : function ( silent ) {

		this. length = 0;
		
		this. buildIndexes();

		if ( ! silent ) this. trigger ( 'reset', this );
	},

	url : function (  ) {

		return this. config. endpoint;
	},

	get : function ( model_id ) {

		var model_index = this. indexOf ( model_id );
		
		return this. at ( model_index ) || null;
	},

	at : function ( model_index ) {

		return this [ model_index ] || null;
	},

	indexOf : function ( model_id ) {

		var indexes		= this. indexes,
			model_cid	= indexes. id_to_cid [ model_id ] || model_id,
			model_index	= indexes. cid_to_index [ model_cid ];

		return model_index >= 0 ? model_index : -1;
	},

	add : function ( models ) {

		var self				= this,
			added				= [  ],
			return_single_model	= false;

		if ( ! models ) return added;

		if ( ! ( 'length' in models ) ) ( models = [ models ] ) && ( return_single_model = true );

		_. each ( models, function ( model ) {

			var added_model	= self. _add ( model );
			
			if ( added_model ) added. push ( added_model );
		} );

		_. each ( added, function ( model ) {

			var model_index = self. indexOf ( model. cid );

			self. trigger ( 'add', model, model_index, this );
		} );

		return return_single_model ? added [ 0 ] || false : added;
	},

	_add : function ( model ) {

		var ModelInstance		= this. config. Model,
			is_model_instance	= model instanceof ModelInstance,
			model_ref			= model. id || model. cid,
			existing_model		= this. get ( model_ref ),
			model_config		= _. extend ( { collection : this }, this. config );

		if ( ! is_model_instance )	model = new ModelInstance ( model, model_config );
		else						_. extend ( model. config, model_config );

		if ( existing_model ) {

			existing_model. set ( model. attributes );
			this. _insert ( existing_model );
			return false;
		}
		
		this. _insert ( model );
		
		this. _proxyModel ( model );

		return model;
	},

	_insert : function ( model ) {

		var comparator		= this. comparator,
			model_index		= this. indexOf ( model. id || model. cid ),
			insert_index	= model_index < 0 ? this. length : model_index;

		if ( comparator )	return this. _insertSort ( model, insert_index, comparator );
		else				return this. _push ( model ) - 1;
	},

	sort : function ( comparator ) {

		comparator = comparator || this. comparator;

		if ( ! comparator ) throw new Error ( 'No comparator available to use for sort.' );

		this. each ( function ( model, index ) {

			this. _insertSort ( model, index, comparator );
		} );

		return this;
	},

	_insertSort : function ( model, model_index, comparator ) {

		for ( var previous_index = model_index - 1; previous_index >= 0; previous_index-- ) {

			var comparison_model = this [ previous_index ];
			
			/*
				`comparator` returns `true` if the model goes before 
				the previous one or `false` for anything else.
			*/
			model_index -= !! comparator. call ( this, model, comparison_model );

			/*
				If the the `model_index` hasn't changed it doesn't 
				need moving.
			*/
			if ( model_index !== previous_index ) break;

			/* move the previous model up to the model index */
			this [ model_index ] = comparison_model;

			/* This isn't a real array so we have to do this ourselves. */
			if ( model_index === this. length ) this. length++;

			this. _addIndex ( comparison_model, model_index );
		}

		/* Place the model at its sorted index */
		this [ model_index ] = model;

		/* This isn't a real array so we have to do this ourselves. */
		if ( model_index === this. length ) this. length++;

		this. _addIndex ( model, model_index );

		return model_index;
	},

	_proxyModel : function ( model ) {

		var self = this;

		model. on ( 'change', function ( model, changed_attributes ) {

			var indexes		= self. indexes,
				changed_id	= changed_attributes. id,
				model_index	= self. indexOf ( model. cid );

			if ( changed_id ) { 
				
				self. _addIndex ( model, model_index );
				delete indexes. id_to_cid [ changed_id. old_value ];
			}

			self. trigger ( 'change', model, changed_attributes, self );
		} );

		model. once ( 'destroy', function ( model ) {

			self. remove ( model );
		} );
	},

	remove : function ( model_id ) {

		var model_index = this. indexOf ( model_id ),
			indexes 	= this. id,
			model;

		if ( model_index < 0 ) return false;

		model = this. splice ( model_index, 1 ) [ 0 ];

		this. trigger ( 'remove', model, model_index, this );

		return true;
	},

	create : function ( attributes, done ) {

		var self	= this,
			model	= self. add ( attributes );


		model. save ( function ( error, model ) {

			if ( error ) return _. fire ( done, error );

			_. fire ( done, null, model, self );
		} );

		return model;
	},

	fetch : function ( done ) {

		var self	= this,
			request = {  };

		request. url		= self. url();
		request. method		= 'get';

		self. sync ( request, self. config, function ( error, synced_models ) {

			var sync_report		= {  },
				added_models	= 0,
				updated_models	= 0,
				removed_models	= 0;

			if ( error ) return _. fire ( done, error );

			/*
				Remove any models from the current collection the are not 
				present in the synced collection.
			*/
			self. each ( function ( model ) {

				var synced_model;

				/* The model hasn't been saved yet so keep it in the collection */
				if ( model. isNew() ) return;

				for ( var i = 0; i < synced_models. length; i++ ) {

					synced_model = synced_models [ i ];

					// The model exists in both collections so quit.
					if ( model. id === synced_model. id ) return;
				}

				// The model doesn't exist in the synced collection so remove it.
				self. remove ( model );
				removed_models++;
			} );

			function countUpdates (  ) { updated_models++; }

			self. on ( 'change', countUpdates );

			added_models = self. add ( synced_models ). length;

			self. off ( 'change', countUpdates );

			sync_report. has_changed	= Boolean ( added_models || updated_models || removed_models );
			sync_report. added			= added_models;
			sync_report. updated		= updated_models;
			sync_report. removed		= removed_models;

			self. trigger ( 'sync', sync_report, self );

			_. fire ( done, null, sync_report, self );
		} );

		return this;
	},

	sync : function ( request_options, config, done ) {

		request ( request_options, done );
	},

	toJSON : function (  ) {

		var json	= [  ],
			model	= null;

		this. forEach ( function ( model ) {

			json. push ( model );
		} );

		return json;
	}
};

/*
	User Model subclass.
*/
function UserModel ( attributes, config ) {

	return Model. call ( this, attributes, config );
}

UserModel. prototype				= new Model();
UserModel. prototype. constructor	= UserModel;

UserModel. prototype. setCustomData = function ( property, value ) {

	var custom_data = this. get ( 'custom_data' );

	custom_data [ property ] = value;

	return this. set ( 'custom_data', custom_data );
};

/*
	Message Model sub class.
*/
function MessageModel ( attributes, config ) {

	return Model. call ( this, attributes, config );
}

MessageModel. prototype					= new Model();
MessageModel. prototype. constructor	= MessageModel;

MessageModel. prototype. url = function (  ) {

	var is_new		= this. isNew(),
		config		= this. config,
		user		= config. user,
		collection	= config. collection,
		endpoint	= collection ? collection. url() : user. url() + endpoint;

	return is_new ? endpoint : endpoint + ( this. id || '' );
};

MessageModel. prototype. reply = function ( message, done ) {

	var config		= this. config,
		collection	= config. collection,
		new_message	= new this. constructor ( message, this. config );

	new_message. set ( 'thread', this. get ( 'thread' ) );
	new_message. set ( 'subject', this. get ( 'subject' ) );

	if ( collection ) collection. add ( new_message );

	new_message. save ( done );
};

/*
	Messages Collection subclass.
*/
function MessagesCollection ( models, config ) {

	config. Model = MessageModel;

	return Collection. call ( this, models, config );
}

MessagesCollection. prototype				= new Collection();
MessagesCollection. prototype. constructor	= MessagesCollection;

MessagesCollection. prototype. url = function (  ) {

	var config		= this. config,
		endpoint	= config. endpoint,
		user		= config. user;

	return user. url() + endpoint;
};

MessagesCollection. prototype. comparator = function ( model, comparison ) {

	var model_created_at		= Date. parse ( model. get ( 'created_at' ) ),
		comparison_created_at	= Date. parse ( comparison. get ( 'created_at' ) );

	return model_created_at < comparison_created_at;
}

/*
	Supportive.io module.
*/
function Supportive ( app_id, api_token ) {

	var self				= this,
		constructor			= this. constructor,
		UserModel			= constructor. UserModel,
		MessagesCollection	= constructor. MessagesCollection,
		user_config			= {  };

	self. app_id			= app_id;
	self. api_token			= api_token;
	self. initialized		= false;
	self. poll_timer		= null;

	user_config. endpoint	= self. endpoint ( 'users' );
	user_config. api_token	= api_token;

	self. user = new UserModel ( null, user_config );
	
	self. messages = self. createMessagesCollection();

	Events. addTo ( self );

	self. user. on ( 'sync', function (  ) {

		self. initialized = true;
	} );

	self. messages. on ( 'add', function ( message, collection ) {

		var message_type = message. get ( 'type' );

		if		( message_type === 'broadcast' )	self. trigger ( 'message:broadcast', message, collection );
		else if	( message_type === 'incoming' )		self. trigger ( 'message:incoming', message, collection );
		else if ( message_type === undefined )		self. trigger ( 'message:outgoing', message, collection );

		self. trigger ( 'message', message, collection );
	} );
}

Supportive. prototype = {

	constructor : Supportive,

	endpoint : function ( name, exclude_base_url ) {

		var statics		= this. constructor,
			base_url	= statics. BASE_URL + this. app_id,
			endpoint	= statics. ENDPOINTS [ name ];

		return exclude_base_url ? endpoint : base_url + endpoint;
	},
	
	init : function ( user, done ) {
		
		var self = this;

		self. _setupUser ( user );

		self. user. save ( function ( error ) {

			if ( error ) return _. fire ( done, error );
			
			self. fetchMessages ( function ( error, sync_report, messages ) {

				if ( error ) return _. fire ( done, error );

				self. listenForMessages();

				_. fire ( done, null, user, messages, self );
			} );

		} );

		return self;
	},

	createMessagesCollection : function ( models ) {

		var MessagesCollection	= this. constructor. MessagesCollection,
			config				= {  };

		config. user		= this. user;
		config. endpoint	= this. endpoint ( 'messages', true );
		config. api_token	= this. api_token;

		return new MessagesCollection ( null, config );
	},

	createMessageModel : function ( attributes ) {

		var MessageModel	= this. constructor. message_model,
			config			= {  };

		config. user		= this. user;
		config. endpoint	= this. endpoint ( 'messages', true );
		config. api_token	= api_token;

		return new MessageModel ( attributes, config );
	},

	send : function ( subject, text, custom_data, done ) {

		var message = {  };

		if		( typeof text === 'object' )			( custom_data = text )	&	( text = null );
		else if	( typeof text === 'function' )			( done = text )			&	( text = null );
		else if	( typeof custom_data === 'function' )	( done = custom_data )	&	( custom_data = null );

		if ( ! this. initialized ) return _. fire ( done, 'Cannot send message: user not initialized.' );

		message =	{
						subject		: subject,
						text		: text,
						custom_data	: custom_data
					};

		return this. messages. create ( message, done );
	},

	fetchMessages : function ( done ) {

		if ( ! this. initialized ) return _. fire ( done, 'Cannot fetch messages: user not initialized.' );

		this. messages. fetch ( done );

		return this;
	},

	listenForMessages : function (  ) {

		var sync_interval	= this. constructor. MESSAGE_POLL_INTERVAL,
			handler			= _. bind ( this, this. fetchMessages );

		if ( ! this. initialized ) return _. fire ( done, 'Cannot poll for messages: user not initialized.' );

		if ( this. poll_timer ) return false;

		return this. poll_timer = window. setInterval ( handler, sync_interval );
	},

	stopListeningForMessages : function (  ) {

		window. clearInterval ( this. poll_timer );

		return this. poll_timer = null;
	},

	_setupUser : function ( attributes ) {

		if ( ! attributes. identifier ) throw new Error ( 'A user requires an identifier.' );

		this. user. set ( attributes );
	}
};

/*
	Static Properties.
*/
Supportive. MESSAGE_POLL_INTERVAL	= 60000
Supportive. BASE_URL				= 'https://api.supportive.io/apps/',
Supportive. ENDPOINTS				= 	{
											users		: '/users/',
											messages	: '/messages/'
										};

/*
	Setup Sync
*/
Supportive. sync = function ( request_options, config, done ) {

	var headers = request_options. headers = request_options. headers || {  };

	if ( config. api_token ) headers. Authorization = 'Bearer ' + config. api_token;

	request ( request_options, done );
};

/*
	Return `window.Supportive` back to whatever 
	it was before loading loading this lib. 
	returning a reference to the Supportive
	module.
*/
Supportive. noConflict = function (  ) {

	window. supportive = orignalSupportive;

	return this;
};

Supportive. Events				= Events;
Supportive. Model				= Model;
Supportive. Collection			= Collection;
Supportive. UserModel			= UserModel;
Supportive. MessageModel		= MessageModel;
Supportive. MessagesCollection	= MessagesCollection;

UserModel. prototype. sync			= Supportive. sync;
MessageModel. prototype. sync		= Supportive. sync;
MessagesCollection. prototype. sync	= Supportive. sync;

/*
	Export the Supportive module.
*/
if		( typeof define === 'function' )	define ( Supportive )
else if	( typeof module !== 'undefined' )	module. exports		= Supportive;
else										window. Supportive	= Supportive;

} ) ( window );
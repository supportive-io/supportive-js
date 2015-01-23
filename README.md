A vanilla, dependency-free browser JS library for the [Supportive.io](http://supportive.io) API.

If you're new to Supportive.io, you probably want to skim over [how it works](http://docs.supportive.io/introduction/) before diving in.

Caveat: Only works in HTML 5+ browsers (probably). ;)

---

## Contents

1. [Install](#install)
2. [Quick Start](#quick-start)
3. [Guide](#guide)
    1. [Supportive.js Constructor](#guide/supportive-constructor)
    2. [Initialization](#guide/initialization)
    3. [Event Handling](#guide/events)
    4. [Working with Messages](#guide/messages)
        1. [Listening for Messages](#guide/messages/events)
        2. [Sending Messages](#guide/messages/sending)
        3. [Replying to Messages](#guide/messages/replying)
        4. [Marking read Messages](#guide/messages/read)
        5. [Removing Messages](#guide/messages/removing)
        6. [Working with Message Collections](#guide/messages/collections)
        7. [Working with threads](#guide/messages/threads)
    5. [Working with Users](#guide/users)
        1. [Creating a User](#guide/users/creating)
        2. [Updating a user](#guide/users/updating)
4. [API Docs](#api)
    1. [Supportive.js](#api/supportive.js)
    2. [Events](#api/events)
    3. [Model](#api/model)
    4. [Collection](#api/collection)
    5. [UserModel](#api/user-model)
    6. [MessageModel](#api/message-model)
    7. [MessagesCollection](#api/messages-collection)

---

## <a name="install"></a> Install

Via bower:
```language-bash
bower install --save supportive-js
```

Via npm:
```language-bash
npm install --save supportive-js
```

---

## <a name="quick-start"></a> Quick Start

<p>1. Add the script to your page.</p>

```language-markup
<script type="application/javascript" src="<path_to_supportive_js>/supportive.js"></script>
```

<p>2. Prepare Supportive.js.</p>

```language-javascript
var support = new Supportive( 'your_app_id', 'your_api_token' );
```

<p>3. Initialise <a href="http://supportive.io">Supportive.io</a>.</p>

```language-javascript
var user =  {
                identifier  : 'ashheskes',
                email       : 'ash@supportive.io',
                name        : 'Ash Heskes',
                custom_data :
                    {
                        test : true
                    }
            };

support. init( user, function( error, user, messages ) {

    if ( error ) return alert( ':( Something went wrong!' );

    /* do stuff... */
} );
```

<p>4. Listen for new messages.</p>

```language-javascript
support. on( 'message', function( message ) {
    
    /* do stuff... */
} );
```

<p>5. Send a support message.</p>

```language-javascript
support. send( 'Feedback!', 'I love your App.', { page : 'home' }, function( error, message ) {

    if ( error ) return alert( ':( Something went wrong!' );
    
    /* do stuff... */
} );
```

---

## <a name="guide"></a> Guide

The Supportive.js API is relatively simple and straight forward. If you have ever used [backbone.js](http://backbonejs.org/), you will be familiar with many of the workings of this lib.

We have an inbuilt concept of models and collections for communicating with our REST API, although you are likely to be only interested in the `support.user` model and the `support.messages` collection.

---

### <a name="guide/supportive-constructor"></a> Supportive Constructor.

Most of everything hangs off the global `Supportive` constructor. If you ever need to make modifications to the internals of the lib(e.g. to overwrite `sync` during tests), you can access everything from here:

```language-javascript
var support = new Supportive( 'your_app_id', 'your_api_token' );
```

Once constructed, you can access the `user` and their `messages` directly via...

```language-javascript
support. user       // > UserModel
support. messages   // > MessagesCollection
```

---

### <a name="guide/initialization"></a> Initialising Supportive

Initialising supportive.js is a simple process, so we created a convenience `init` method for you. The `init` method does three things: it initialises the user with Supportive.io(basically sends `post` request) then fetches the users message's, and starts listening for new ones.

```language-javascript
var user_props =    {
                        identifier  : 'ashheskes', // Required: hyphen separated numbers and letters only.
                        email       : 'ash@supportive.io',
                        name        : 'Ash Heskes',
                        custom_data : // Any custom data you have about the user e.g. { plan : 'premium' }
                            {
                                test : true
                            }
                    };

support. init( user_props, function( error, user, messages ) {

    if ( error ) return alert( ':( Something went wrong!' );
    
    /* do stuff e.g. render the messages to screen */
} );
```

If you need more fine-grained control over timing or fetching messages, you can easily initialise support manually. As mentioned above, you do this using `support.user` and `support.messages`.

```language-javascript
/* Initialize the user with supportive.io */
support. user. save( user_props, function( error, user ) {

    if ( error ) return alert( ':( Something went wrong!' );
    
    /* You can also check if the user has been initialized in two ways */

    support. initialized   // > true
    support. user. isNew() // > false
} );
```

Once a user has been setup, you can manually fetch messages.

```language-javascript
    /* Convenience method */
    support. fetchMessages( function( error, sync_report, messages ) {

        if ( error ) return alert( ':( Something went wrong!' );
        
        /* What's a sync report ? */
        sync_report. has_changed // > true
        sync_report. added       // > 10
        sync_report. updated     // > 0
        sync_report. removed     // > 0
        
        /* do stuff... */
    } );

    /* Directly with the messages collection */
    support. messages. fetch( function( error, sync_report, messages ) {

        if ( error ) return alert( ':( Something went wrong!' );
        
        /* do stuff... */
    } );
```

If you intend to run Supportive.js in environments where you're sharing the `window` with another application(a chrome extension, a js widget, etc.), you don't really want to interfere with their instance of Supportive.js should they have one running. It might be a different version or they may have customised it. 

In these cases, it's generally a good idea to encapsulate all your code and libraries in a self-executing function so internal variables aren't assigned to the `window`.

Once you've bundled you're code the Supportive.js lib will explicitly attach itself to the `window`. However, you can use `Supportive.noConflict()` to restore the reference to `window.Supportive` to what it was before the lib was loaded, and return the current copy of `Supportive.js` for you to store a reference to.


```language-markup
<script type="applicaton/javascript">
    
    console. log( window. Supportive );

    // > undefined

</script>
<script type="applicaton/javascript" src="/path_to_supportive-js/supportive.js"></script>
<script type="applicaton/javascript">

    ( function( window, undefined ) {
    
        console. log( window. Supportive );

        // > [Function [Supportive](#api/supportive)]

        var localSupportive = window. Supportive. noConflict();

        console. log( window. Supportive );

        // > undefined

        console. log( localSupportive );

        // > [Function [Supportive](#api/supportive)]

    } ) ( window );
</script>
```

---

### <a name="guide/events"></a> Event handling

Pretty much everything in Supportive.js fires events and is capable of firing custom events.

All the examples below use the `support.messages` collection but the same rules apply to all event emitters.

<p>1. Listen to an object.</p>

```language-javascript
function listener(  ) {
    
    /*
        The `arguments` passed to the listener
        will vary based upon the arguments sent
        by whatever triggered the event.
    */
    console. log( 'fired', arguments );    
}

/* Listen to a specific event */
support. messages. on( 'event_name', listener );

/* listen for any event */
support. messages. on( '*', listener );
```

<p>2. Stop listening to an object.</p>

```language-javascript
/* Removes a specific listener for an event */
support. messages. off( 'event_name', listener );

/* Remove all listeners of a specific event */
support. messages. off( 'event_name' );

/* Remove all listeners for all events */
support. messages. off();
```

<p>3. Trigger an event.</p>

```language-javascript
support. messages. trigger( 'foo-event', 'this is passed to the listener', 'so is this', /*,...*/ );
```

The `Events` class has been kindly added to the `Supportive` namespace so you're welcome to use it to add events to your own objects.

---

### <a name="guide/messages"></a> Working with messages

As you would expect, working with messages is pretty simple. There are a couple of things you should know about how messages work in Supportive.io.

1. Messages cannot be modified once they have been saved.
2. Messages have threads and all new messages start a new thread.
3. Messages can be replied to in order to maintain threads.
4. Messages can be marked as `read`. This is the only update possible.
5. Messages can be deleted. Although they still exist, they will never again be returned in a fetch.

If you haven't already, check out the [messages](http://docs.supportive.io/http-api/#messages) section in the REST API Docs to see what messages consist of.

After you have constructed Supportive.js via `var support = new Supportive( app_id, api_token )`, a message collection is created for you and is accessible via `support.messages`.

Checkout the [initialization docs](#guide/initialization) for an intro into fetching messages.

---

### <a name="guide/messages/events"></a>Listening on messages

What's the point of support if it's one way?! :)

If you initialized supportive.js via the `init` method you don't really need to do anything. If you used manual initialization you can start or stop listening for messages manually.

```language-javascript
support. listenForMessages();
support. stopListeningForMessages();
```

Listening in on new messages is easy.

```language-javascript
support. on( 'message', function( message ) {
    
    /* fires for all new messages */
} );
```

You might want to handle types of messages differently, such as `broadcast` messages.

```language-javascript
support. on( 'message:outgoing', function( message ) {

    /* Fires for all messages sent by the user */
} );

support. on( 'message:incoming', function( message ) {
        
    /* Fires for all messages from support directly to the user */
} );

support. on( 'message:broadcast', function( message ) {
    
    /* Fires for all broadcast messages */
} );
```

While that takes care of new messages, you may want to listen for any changes to the `support.messages` collection. For example, if you need to update your UI when a message has changed or been removed.

You can do this by listening directly to the `support.messages` collection.

```language-javascript

support. messages. on( 'change', function( message, changed_attributes ) {

    /*
        `changed_attributes` is an object containing the properties 
        that changed and their old and new values.

        e.g.
    */
    changed_attributes. read // > { new_value : true, old_value : false } 

    /* Fires for all changes to a message */
} );

support. messages. on( 'remove', function( message ) {

    /*
        Fires whenever a message is removed from the
        collection although that doesn't mean it has 
        been deleted.
    */  
} );

support. messages. on( 'add', function(  ) {
    
    /*
        Fires whenever a message is added to the collection
        even if it hasn't been sent yet.
    */
} );

support. messages. on( 'sync', function( sync_report, messages ) {
    
    /*
        Fires when a successful sync happens irrespective of whether
        anything changed.
    */
} );
```

---

### <a name="guide/messages/sending"></a> Sending messages

You can send messages in a few different ways.

<p>1. Convenience method.</p>

```language-javascript
var subject     = 'Howdy!',
    text        = 'I need some love.',
    custom_data = { page : window. location. href };


var message = support. send  subject, text, custom_data, function( error, message ) {

    if ( error ) return alert( ':( Something went wrong!' );

    /* do stuff... */
} );
```

<p>2. Create a message with the messages collection and save it instantly.</p>

```language-javascript
var message_props = {
                        subject     : subject,
                        text        : text,
                        custom_data : custom_data
                    };


var message = support. messages. create( message_props, function( error, message ) {
    
    if ( error ) return alert( ':( Something went wrong!' );

    /* do stuff... */
} );
```

<p>3. Add a message to the messages collection and save it later.</p>

```language-javascript
var message = support. messages. add( message_props );

message. save( function( error, message ) {
    
    if ( error ) return alert( ':( Something went wrong!' );

    /* do stuff... */
} );
```

<p>4. If you prefer, work with an individual message outside of a collection.</p>

```language-javascript
var message = support. createMessageModel();

/* Set the properties individually. */
message. set( 'subject', subject );
message. set( 'text', text );
message. set( 'custom_data', custom_data );

/* Or all at once. */
message. set( message_props );

/* Then save the message. */
message. save( function( error, message ) {

    if ( error ) return alert( ':( Something went wrong!' );

    /* do stuff.. */
} );

/* Or just do it all in one go */
message. save( message_props, function( error ) {

    if ( error ) return alert( ':( Something went wrong!' );
    
    /* do stuff... */
} );
```

##### Note:
In all cases, it's worth remembering that the `return` will be the constructed message model, should you need to work with it later.

---

### <a name="guide/messages/replying"></a> Replying to messages.

Let's say we have a simple `<form>` for replying to a message. The form's `name=""` is the `id` of the message it's replying to.

```language-javascript
var reply_form = document. getElementById( 'reply-form' );

reply_form. addEventListener( 'submit', function( event ) {

    var message_id  = reply_form. name,
        message     = support. messages. get( message_id ),
        subject     = reply_form. querySelector( '[name="subject"]' ). value,
        text        = reply_form. querySelector( '[name="text"]' ). value;

    message. reply( { subject : subject, text : text }, function( error, reply ) {
    
        if ( error ) return alert( ':( Something went wrong!' );
        
        /* Maintain a reply to the last message */
        reply_form. name = reply. id;

        /* do stuff... */
    } );
} );
```

---

### <a name="guide/messages/read"></a> Marking messages as read

It's nice to display a message differently if it hasn't been seen by the user.

```language-javascript
var message = support. messages. at( 0 );

message. save( { read : true }, function( error, message ) {
    
    if ( error ) return alert( ':( Something went wrong!' );

    /* do stuff... */
} );
```
##### Note:
It may or may not be obvious, but all messages sent by the user are marked as `read = true` by default.

---

### <a name="guide/messages/removing"></a> Removing messages

As mentioned previously, messages in Supportive.io never really get deleted. Instead, they get marked as archived internally. Once a message has been marked as archived it will never be returned when fetching a list of the user's messages. Archiving is still done via a `Delete` request.

Once a message model has been destroyed the model will automatically delete any of the model's attributes, empty out any event listeners, and mark itself as `destroyed = true`.

```language-javascript
var message = support. messages. at( 0 );

/*
    Removes the message from the messages collection 
    but doesn't delete it.
*/
support. messages. remove( message. id );

/*
    Actually deletes the message if the message is 
    part of a collection by removing itself.
*/
message. destroy( function( error ) {
    
    if ( error ) return alert( ':( Something went wrong!' );

    /* do stuff... */
} );
```

---

### <a name="guide/messages/collections"></a> Working with message collections.

Sometimes having all messages in one collection isn't really enough. Let's say we wanted a couple of virtual support channels: one for feature requests and one for bug reports. It makes sense that these two message types should have their own collections so they can be maintained and rendered separately.

Supportive.io makes this possible in a number of ways. Our suggested method is to use the `subject` field as a virtual channel. That makes it easy to create a filter in most email clients to separate them into a specific folder. You could also use the `custom_data`, but it's up to you to filter that in an email client :). You could also use the message text, but again it makes filtering much harder and more error prone.

For our example we will use the subject field in a format like...

1. feature requests : `{ subject : 'features: ' + user_subject }`
2. bug reports      : `{ subject : 'bugs: ' + user_subject }`

Let's start by making our new collections. They enjoy all the same functionality as `support.messages` such as events, adding, and removing messages, etc. 

```language-javascript
var feature_requests = support. createMessagesCollection(),
    bug_reports      = support. createMessagesCollection();
```

Now we need to add our messages to the new collections.

```language-javascript
function filterMessage( message ) {
    
    var subject            = message. subject,
        is_feature_request = subject. match( /^features:/ ),
        is_bug_report      = subject. match( /^bugs:/ );

    if ( is_feature_request )   feature_requests. add( message );
    if ( is_bug_report )        bug_reports. add( message );
}

support. messages. each( filterMessage );
```

Lastly, we need to do the same for any new messages hitting `support.messages`. Our `proxyMessage` function can handle that too.

```language-javascript
support. messages. on( 'add', proxyMessage );
```

You can also combine message collections(check out [threading](#guide/messages/threads) ). While we still advise using the subject line for filtering messages in your email client, you could switch out `filterMessage()` to filter on `thread` id.

##### Note:
It doesn't really make sense to `remove()` any messages from the main `support.messages` collection because they are just going to get re-added on the next sync.

---

### <a name="guide/messages/threads"></a> Working with threads

If you want to have a threaded UI for messages you will want to make sure that you maintain a messages thread.

All messages in Supportive.io are assigned a random thread id when they are created unless one is provided. Internally we use the thread id in two ways:

1. When creating a message : if a thread id is supplied, we will lookup that thread and copy the subject and extend any `custom_data` from the last message to the new message. We also use it to populate the `InReplyTo` field in the email we send to you, making sure your email client preserves the thread too.
2. When receiving an incoming email: from you're support inbox to a user, or even a broadcast, we lookup the `InReplyTo` header and do the same merging of the message details and thread id before sending it to you're users in App.

This leaves a couple of things for you to consider about how you could or should use threads. Left alone, it means threading on both sides should be natural(i.e. sending a new message starts a new thread and replying to a message extends a thread). However, in Supportive.io, thread id's are a concept, not a rule. If you want, you can create your own naming conventions for threads.

Let's say we wanted a thread specifically for bug reports, so we decide to make our `thread = 'bug-reports'`.

```language-javascript
var starting_message = support. messages. create( { text : 'A bug', thread : 'bug-reports' } );
```

In Supportive.io thread ids are global to each app, not each user. This has some implications that you may or may not want...

1. Messages fetched on behalf of user will only ever contain messages sent by or to that user. Not every message that is in a `thread`.
2. Messages sent to your inbox will always follow the global thread id. In essence, that means all users who send a message with that `thread` id will be going into a single gargantuan thread in your inbox.

If you wanted to make sure that bug reports went into separate threads in your email client. All you would need to do is make sure the thread id is unique to the user.

```language-javascript
var starting_message = support. messages. create( { text : 'A bug', thread : 'bug-reports:' + user. id } );
```

Sometimes global threads may be desired though. For example, if you wanted to put a simple "Too expensive?" thumbs up button at the bottom of the your pricing. You don't really need or want to ask the user to do anything more than click it, but you would like to know the number of responses you get and have them collated in one place.

```language-javascript
var too_pricey_button = document. getElementById( 'too-pricey' );

too_pricey_button. addEventListener( 'click', function( event ) {
    
    support. messages. create( { thread : 'lower-prices' } );

    /* Prevent multiple clicks */
    too_pricey_button. disabled = true;
} );
```

Using a global `thread` means that all messages sent to your inbox will stay in that thread. You can always reply to the messages from your inbox thread should you want to reach out to the users that responded later.

Once you have decided(or not decided, as the case may be) on if and how you want to use threads, maintaining that thread is as easy as `reply()`.

It's worth mentioning that combining threading with [message collections](#guide/messages/collections) can make a pretty powerful combination. Although it's not yet implemented in our API, we intend to roll out private API tokens that will give you broader access to users and messages. When that happens, you could use threading and message collections to implement user forums for bugs, feature requests, or whatever.

---

### <a name="guide/users"></a> Working with a user

In a typical case, you will only ever be dealing with one user in Supportive.js. In fact, we can't think of any cases where you will you need to work with more. (But if you can, let us know!)

Things you should know about users.

1. Creating a user adds metadata: when a user is created or updated using a `post` we add metadata about their location, device, and session from the request.
2. Updating a user doesn't add metadata: when you update an existing user via a `put` no metadata is added.
3. Users cannot be deleted: this may change but for now we don't find it useful to allow a public api token to destroy your users data.

It might be a good idea to head over to the [user section](http://docs.supportive.io/http-api/#users) of HTTP API to get a feel for what a user looks like.

When Supportive.js has been constructed via `var support = new Supportive( app_id, api_token )`, a user instance is created for you and is accessible via `support.user`.

---

### <a name="guide/users/creating"></a> Creating a user

Because we don't expect that you will ever need to initialize more than one user per Supportive.js instance, you can't create users outside of the pre-constructed `support.user`.

If you really need to for whatever crazy reason, a workaround could be achieved by constructing multiple Supportive.js instances(e.g. `support_2 = new Supportive( app_id, api_token )`). That way each instance will act as a silo for each user and their messages.

Setting up your main user is covered in [initialization](#guide/initialization).

---

### <a name="guide/users/updating"></a> Updating a user

Once the `support.user` has been initialized(you can tell by calling `isNew()` on the user), you can then update all the properties you pass during [initialization](#guide/initialization).

An solid example of when it's good to update a user is event tracking. Similar to how you track events with analytics. In Supportive.io, users have `custom_data` which could be seen as tagging and is a similar concept to analytics, except specific to each user.

Let's say we have defined a point in our apps workflow that we would use to deem a user as `active`. It would be good to know that when you receive support messages from them.

For simplicity's sake, let's say that a user is `active` once they have updated their profile name.

```language-javascript
var profile_form = document. getElementById( 'profile-form' );

function updateProfile( name done ) {
    
    /* do some work to update the users profile... */
    done( error, user );
}

profile_form. addEventListener( 'submit', function( event ) {
    
    var name = profile_form. querySelector( '[name="name"]' ). value;

    updateProfile( name, function( error, user ) {

        var custom_data;
        
        if ( error ) return alert( ':( Something went wrong!' );

        /* We need a copy of the current `custom_data` object so we don't overwrite any properties already set */
        custom_data         = support. user. get( 'custom_data' );
        custom_data. active = true;

        /* Go ahead and save the user, we don't need pass a callback */
        support. user. save( { name : name, custom_data : custom_data } );

        /* Alternately you can use a convenience method */
        support. user. setCustomData( 'active', true );
        support. user. set( 'name', name );

        support. user. save();
    } );
} );
```

---

## <a name="api"></a> API Docs

### <a name="api/events"></a> Supportive.Events

###### `new Supportive.Events( [context] )`

`Supportive.Events` is a stand-alone module for triggering and listening on events. It can also be used to mix into other objects via [`Events.addTo()`](#api/events/add-to). Internally we use this to extend the [Supportive](#api/supportive), [Model](#api/model) and [Collection](#api/collection) classes with events.

On its own, it simply constructs an `Object` that can be listened to, or have events triggered on. This could be useful in your app if you wanted, say, a global events dispatcher.

The optional `context` argument is the object that all event handlers get called in context of. For instance, the handlers reference to `this`, which defaults to the natural `this` of the events instance.

Returns `this`.

##### Usage:
```language-javascript
var App        = { username : 'johnny' },
    dispatcher = new Supportive. Events( App );

dispatcher. on( 'alert', function( message ) {
    
    var username = this. username;

    alert( 'Hey' + username + ':' + message );
} );

dispatcher. trigger( 'alert', 'You just scored 10 points!' );
```

#### <a name="api/events/add-to"></a> addTo

###### `Supportive.Events.addTo( object )`

A convenience method for adding events to another object. Essentially all this does is construct a new instance of `Events` passing in the `object` and copying over all event methods bound to the constructed `events` instance.

While that might sound unusual, it's our preference to not dirty external objects with the internal properties needed for managing events.

##### Usage:
```language-javascript
var object = {  };

Supportive. Events. addTo( object );

object. on( 'error', function( message ) {

    alert( message );
} );

object. trigger( 'error', ':( Something went wrong!' );
```

#### <a name="api/events/on"></a> on

###### `object.on( event_name, callback )`

Binds a listener to an event. When that event name is triggered the callback will be fired. Any `arguments` passed to [`trigger()`](#api/events/trigger) after the `event_name` will be forwarded to the callback. If a context object was supplied at construction the callback will be bound to it.

Returns `Object`.

##### Usage:
```language-javascript
message. on( 'destroy', doSomething );
```

#### <a name="api/events/off"></a> off

###### `object.off( [event_name], [callback] )`

Removes the `callback` listening to `event_name`. If no `callback` is passed, all listeners for the `event_name` will be removed. If no `event_name` is passed all listeners attached to the object will be removed.

Returns `true` or `false` to indicate if the operation was successful. If a `callback` was passed and couldn't be found it returns `false`. For everything else it returns `true`.

##### Usage:
```language-javascript
/* Remove `doSomething` from `alert` events */
object. off( 'alert', doSomething );

/* Remove all listeners for `alert` */
object. off( 'alert' );

/* Remove all events form `object` */
object. off();
```

#### <a name="api/events/trigger"></a> trigger

###### `object.trigger( event_name, [*args] )`

Fires listeners for `event_name`. Any following `[*args]` will be passed to each fired listener.

Returns `Object`.

##### Usage:
```language-javascript
object. on( 'change', function( property, value ) {
    
    console. log( property, value );
} );

object. trigger( 'change', 'foo', 'bar' );
```

#### <a name="api/events/once"></a> once

###### `object.once( event_name, callback )`

Only fire the `callback` for an event once. Repeated firing of the `event_name` will not result in `callback` being fired.

##### Usage:
```language-javascript
object. on( 'change', function( property, value ) {
    
    console. log( property, value );
} );

object. trigger( 'change', 'foo', 'bar' );
```

#### <a name="api/events/listeners"></a> listeners

###### `object.listeners()`

Returns the internal map of bound events and their listeners. This is here purely for convenience if for any reason you need to inspect the internal listeners on an `object`.

Returns `Object`.

##### Usage:
```language-javascript
object. listeners();

// > {
        "alert" : [ listener,... ]
     }
```

#### <a name="api/events/events-catalogue"></a> Catalogue of Events

These are all the events fired by Supportive.js components and their arguments.

1. **'change'** ( model, changed_attributes, [collection] ) - Fired when a model’s properties change. If the model is part of a collection the event will also fire on the collection.
2. **'change:[attribute]'** ( model, property, new_value, old_value ) - Fired when a specific model’s property changes.
3. **'sync'** ( model_or_sync_report, [collection] ) - Fired by a model or collection when they have successfully synced with the server. If fired on a model you will be passed the model. If fired on a collection you will be passed a `sync_report` detailing the updates along with the `collection`.
4. **'destroy'** ( model, [collection] ) - Fired when a model is destroyed. If the model is part of a collection it will also be fired on the collection.
5. **'add'** ( model, collection ) - Fires when a new model is added to a collection.
6. **'remove'** ( model, collection ) - Fires when a model is removed from a collection.
7. **'reset'** ( collection ) - Fires when a collection has been `reset()`.
8. **'message'** ( message, collection ) - Fires on a `Supportive` instance when a new message has been received.
9. **'message:[type]'** - As above only it fires for the message `type` i.e. `'broadcast'`, `'incoming'`, `'outgoing'`.

---

### <a name="api/supportive"></a> Supportive

###### `new Supportive( app_id, api_token )`

This is the exported namespace for the Supportive.js module.

The constructor creates a new instance of Supportive.js

##### Usage:
```language-javascript
var support = new Supportive( app_id, api_token );
```

#### <a name="api/supportive/app-id"></a> app_id

###### `support.app_id`

A reference to the `app_id` passed into the constructor. Internally this is used to construct the URLs for our api endpoints.

##### Usage:
```language-javascript
console. log( support. app_id );

// > '<your_app_id>'
```

#### <a name="api/supportive/api-token"></a> api_token

###### `support.api_token`

A reference to the `api_token` passed into the constructor. We pass this off to [Models](#api/models) and [collections](#api/collection) as a `config` property which they use for [sync](#api/supportive/sync).

##### Usage:
```language-javascript
console. log( support. api_token );

// > '<your_api_token>'
```

#### <a name="api/supportive/initialized"></a> initialized

###### `support.initialized`

A flag to indicate if this instance of `support` has been initialized. This happens once a [user](#api/user-model) has been synced.

##### Usage:
```language-javascript
support. user. once( 'sync', function(  ) {
    
    console. log( support. initialized )

    // > true
} );
```

#### <a name="api/supportive/poll-timer"></a> poll_timer

###### `support.poll_timer`

Currently, keeping messages in sync is done via polling. This is a reference to the `timer_id` returned from `window.setInterval()`. We set and use this internally when calling [`listenForMessages()`](#api/supportive/listen-for-messages) and [`stopListeningForMessages()`](#api/supportive/stop-listening-for-messages). This is done automatically when using [`init()`](#api/supportive/init`.

##### Usage:
```language-javascript
support. listenForMessages();

console. log( support. poll_timer );

// > 340

support. stopListeningForMessages();

console. log( support. poll_timer );

// > null
```

##### Note:
This will change in future once we roll out a our websockets implementation.

#### <a name="api/supportive/user"></a> user

###### `support.user`

A reference to the constructed [`UserModel`](#api/user-model) that this instance of support is dealing with. Internally used to pass as a `config` property when constructing a [MessagesCollection](#api/messages-collection) so it can [sync](#api/supportive/sync) messages for that user.

##### Usage:
```language-javascript
console. log( support. user );

// > [[Object UserModel](#api/user-model)]
```

#### <a name="api/supportive/messages"></a> messages

###### `support.messages`

A reference to the constructed [MessagesCollection](#api/messages-collection) that will be the main container for all of the users messages. It is also used as the target collection that [`listenForMessages()`](#api/supportive/listen-for-messages) syncs to.

Internally we proxy any `add` [events](#api/events) fired from the messages collection to `support` as... 

1. `'message'` : Fires for all messages.
2. `'message:broadcast'` : Fires for broadcast messages.
3. `'messages:incoming'` : Fires for incoming messages sent directly to the user.
4. `'messages:outgoing'` : Fires for all messages sent by the user.

##### Usage:
```language-javascript
console. log( support. messages );

// > [[Object MessagesCollection](#api/messages-collection)]
```

#### <a name="api/supportive/endpoint"></a> endpoint

###### `support.endpoint( endpoint_name, [exclude_base_url] )`

This is largely an internal method for retrieving and constructing the Supportive.io endpoints that are passed to a [models](#api/models) and [collections](#api/collections) `config`. 

It constructs urls by looking up the static `Supportive.BASE_URL` and `Supportive.ENDPOINTS` properties and merges them with the [`app_id`](#api/supportive/app-id).

If for any reason you ever need to point API calls made by Supportive.js somewhere else(e.g. for testing), you could overwrite those static properties. We actually do this internally when testing Supportive.js against our local API environment.

##### Usage: 
```language-javascript
support. endpoint( 'users' );

// > 'https://api.supportive.io/apps/:[app_id](#api/supportive/app-id)/users/'

support. endpoint( 'users', true );

// > '/users/'
```

#### <a name="api/supportive/init"></a> init

###### `support.init( user_properties, [done] )`

Initializes the [`user`](#api/supportive/user) with the passed-in [`user_properties`](http://docs.supportive.io/http-api/#users), [fetches their messages](#api/supportive/fetch-messages), and [starts listening](#api/supportive/listen-for-messages) for messages. Once finished it will call with the arguments `done( error, user, messages, support )`.

Returns `support`.

##### Usage: 
```language-javascript
var user_props =  {
                identifier  : 'ashheskes',
                email       : 'ash@supportive.io',
                name        : 'Ash Heskes',
                custom_data :
                    {
                        test : true
                    }
            };

support. init( user_props, function( error, [user](#api/user-model), [messages](#api/messages-collection) ) {

    if ( error ) return alert( ':( Something went wrong!' );

    /* do stuff... */
} );
```

#### <a name="api/supportive/send"></a> send

###### `support.send( [subject], [text], [custom_data], [done] )`

A convenience method for sending a support [message](http://docs.supportive.io/http-api/#messages/resource). Internally it calls [`support.messages.create()`](#api/collection/create.

Causes an [`'add'`](#api/events/list/add) event to be fired on the [messages collection](#api/supportive/messages) and [`'message'`](#api/events/list/message), [`'message:outgoing'`](#api/events/list/message-outgoing) to be fired on the `support` instance.

Returns a [MessageModel](#api/message-model)

##### Usage:
```language-javascript
var subject     = 'Howdy!',
    text        = 'I need some love.',
    custom_data = { page : window. location. href };


support. send( subject, text, custom_data, function( error, [message](#api/message-model) ) {

    if ( error ) return alert( ':( Something went wrong!' );

    /* do stuff... */
} );
```

#### <a name="api/supportive/fetch-messages"></a> fetchMessages

###### `support.fetchMessages( [done] )`

Convenience method for [`support.messages.fetch()`](#api/collection/fetch). This method is also called internally by [`listenForMessages()`](#api/supportive/listen-for-messages) and [`stopListeningForMessages()`](#api/supportive/stop-listening-for-messages). Messages get synced to [`support.messages`](#api/supportive/messages).

Returns `support`.

##### Usage:
```language-javascript
support. fetchMessages( function( error, [sync_report](#api/collection/fetch), [messages](#api/messages-collection) ) {
    
    if ( error ) return alert( ':( Something went wrong!' );

    /* do stuff... */
} );
```

#### <a name="api/supportive/listen-for-messages"></a> listenForMessages

###### `support.listenForMessages()`

Starts polling for new messages to be synced to [`support.messages`](#api/supportive/messages). Internally this calls [`support.fetchMessages()`](#api/supportive/fetch-messages). Once called, it sets [`support.poll_timer`](#api-supportive/poll-timer) to the timer id returned by `window.setInterval()`.

The interval between polling is determined by `Supportive.MESSAGE_POLL_INTERVAL`. If you want to increase the interval between syncs(e.g. to increase performance or reduce http requests), then feel free to go ahead and change this value.

Returns [`support.poll_timer`](#api/supportive/poll-timer).

##### Usage:
```language-javascript
var timer_id = support. listenForMessages();

console. log( timer_id );

// > 340
```

#### <a name="api/supportive/stop-listening-for-messages"></a> stopListeningForMessages

###### `support.stopListeningForMessages()`

Stops polling for new messages and sets [`support.poll_timer`](#api/supportive/poll-timer) to `null`.

Returns [`support.poll_timer`](#api/supportive/poll-timer).

##### Usage:
```language-javascript
var timer_id = support. stopListeningForMessages();

console. log( timer_id );

// > null
```

#### <a name="api/supportive/createMessageModel"></a> createMessageModel

###### `support.createMessageModel( [message_properties] )`

Constructs a [message model](#api/message-model) fully configured for you to work with outside of a collection.

Internally this passes [`support.user`](#api/supportive/user), [`support.api_token`](#api/supportive/api-token) and [`enpdoint`](#api/supportive/endpoint)`( 'messages' )` as the model’s [`config`](#api/message-model/config). 

Returns [MessageModel](#api/message-model).

##### Usage:
```language-javascript
var message = support. createMessageModel();

message. set( 'text', 'Cool App!' );

message. save( function( error, [message](#api/message-model) ) {
    
    if ( error ) return alert( ':( Something went wrong!' );

    /* do stuff... */    
} );
```

#### <a name="api/supportive/createMessagesCollection"></a> createMessagesCollection

###### `support.createMessagesCollection( [messages] )`

Constructs a [messages collection](#api/messages-collection) fully configured for you to start creating and removing messages.

Internally this passes [`support.user`](#api/supportive/user), [`support.api_token`](#api/supportive/api-token), [`enpdoint( 'messages' )`](#api/supportive/endpoint) and [`MessageModel`](#api/message-model) as the collection's [`config`](#api/messages-collection/config).

Returns [MessagesCollection](#api/messages-collection)

##### Usage:
```language-javascript
var messages_collection = support. createMessagesCollection();

messages. create( { text : 'Cool App!' }, function( error, [message](#api/message-model) ) {
    
    if ( error ) return alert( ':( Something went wrong!' );

    /* do stuff... */    
} );
```

---

### <a name="api/model"></a> Supportive.Model

###### `new Supportive.Model( [attributes], [config] )`

Models in Supportive.js are the base class for messages as users. They take care of dealing with creating, updating and deleting HTTP resources. While providing some added elegance for tracking changes to their  properties. 

The Model class is pretty generic to working with HTTP resources. There isn't anything specific to Supportive.js going on. Any specifics needed are added by creating a new class that inherits from `Model`.

As with [Events](#api/events) if you want you're welcome to use this Model class for your own HTTP resources in your App.

One thing to note is that a model's default [`sync()`](#api/model/sync) is our internal `XMLHTTPRequest` handler. Again it's pretty generic with the exception that it is only configured to work with `JSON` and `REST` resources.

The Model constructor takes two optional arguments `attributes` and `config`.

1. `attributes` : an `object` with the properties you want to attach to the model at setup. Although you can always do that later using [`set( attributes )`](#api/model/set).
2. `config` : an `object` containing any config for the model. This is pretty generic and anything you pass will just get copied to [`model.config`](#api/model/config).

Returns `this`

##### Usage:
```language-javascript
var attributes = { username : 'AshHeskes' },
    config     = { endpoint : 'https://api.example.com/users/' },
    user       = new Supportive. Model( attributes, config );

user. get( 'username' )

// > 'AshHeskes'

user. config

// > {
        enpdoint : 'https://api.example.com/users/'
     }
```

#### <a name="api/model/cid"></a> cid

###### `model.cid`

This is an unique client identifier for the model. We use this internally to help index and lookup models in collections that have not yet been saved.

It's probably a good idea to always use the `model.cid` to reference a model from your UI as `model.id` might not exist and therefore will not be found in the collection.

#### <a name="api/model/id"></a> id

###### `model.id`

This is the model’s ID on the server. Internally, whenever a model’s `id` property has been set either manually or from a [`sync()`](#api/model/sync), this is updated. 

We use the `model.id` in the default [`url()`](#api/model/url) function in order construct the REST endpoint for `put` and `delete` requests. e.g. `PUT /users/:model_id`.

#### <a name="api/model/destroyed"></a> destroyed

###### `model.destroyed`

If a [`destroy()`](#api/model/destroy) has been successful, this will be `true`. Otherwise it's `false`.

#### <a name="api/model/attributes"></a> attributes

###### `model.attributes`

This is an `object` containing the attributes that have been set on the model. Attributes aren't applied directly to the model object so it's best to make sure you use [`set()`](#api/model/set) to update a model. Attaching properties directly to `model.attributes` will loose any of the change-tracking and events functionality.

#### <a name="api/model/config"></a> config

###### `model.config`

An `object` containing any config properties that were passed in during construction. The only dependent properties are `config.endpoint` used for [`sync`](#model/sync) and [`config.collection`](#api/collection). 

#### <a name="api/model/is-new"></a> isNew

###### `model.isNew()`

Returns `true` of `false` to indicate if the model exists on the server. Internally this just looks for the presence of the [`model.id()`](#api/model/id). It is also used internally when calling [`save()`](#api/model/save) in order to determine whether to send a `POST` or a `PUT`.

#### <a name="api/model/url"></a> url

###### `model.url()`

A function for returning the constructed url for the model. This is one of the only functions that uses the presence of `endpoint` to be in the [`model.config`](#api/model/config).

If the [`model.isNew()`](#api/model/is-new) it generates URLs based on `config.endpoint + model.id` If the model is part of a collection it switches out the `config.endpoint` for [`collection.url`](#api/collection/url)().

##### Usage:
```language-javascript
var user = new Supportive. Model( null, { endpoint : '/users/' } );

user. url();

// > '/users/'

user. set( 'id', 123 );

user. url();

// > '/users/123'
```

#### <a name="api/model/set"></a> set

###### `model.set( attributes )`

Sets a model’s attributes firing a [`'change'`](#api/events/catalogue) event if any of the attributes were modified. You can pass an `object` containing all the properties you want to set, or an individual `key, value`.

Returns `false` if no properties were updated or a map of `{ property : { new_value : '', old_value : '' } }` of the changes.

##### Usage:
```language-javascript
var user = new Supportive. Model();

user. on( 'change', function( user, changed_attributes ) {
    
    console. log( changed_attributes );
} );

user. set( { name : 'Ash', age : 29 } );

// > {
        name : { new_value : 'Ash', old_value : undefined },
        age  : { new_value : 29, old_value : undefined }
     }

var changes = user. set( age, 30 );

console. log( changes );

// > {
        age : { new_value : 30, old_value : 29 }
     }
```

#### <a name="api/model/get"></a> get

###### `model.get( property )`

Returns a model's property. If the property is an `object`, it returns a copy of the `object`. This is so you can make changes to the object and `set( property, object )` will correctly track the changes.

##### Note:
Changes to objects nested deeper than one level cannot be tracked.

##### Usage:
```language-javascript
product. set( 'metadata', { weight : '10kg' } );

var meta = product. get( 'metadata' ); 

meta === product. attributes. meta

// > false

meta. weight = '5kg';

product. set( 'metadata', meta );

// > {
        metadata :  {
                        new_value : { weight : '5kg' },
                        old_value : { weight : '10kg' }
                    }
     }
```

#### <a name="api/model/save"></a> save

###### `model.save( [attributes], [done] )`

Saves a model to the server. Internally, it calls [sync](#api/model/sync). If the [`model.isNew()`](#api/model/is-ne) it sends a `POST`. Otherwise it sends `PUT`. If `attributes` is passed they will be [set](#api/model/set) on the model before saving.

Fires a [`sync`](#api/events/catalogue) event once the model has been saved.

Returns `this`.

##### Usage:
```language-javascript
var user = new Supportive. Model( null, { endpoint : '/users/' } );

user. save( { name : 'ash' }, function( error, done ) {
    
    if ( error ) return alert( ':( Something went wrong!' );

    /* do stuff... */
} );
```

#### <a name="api/model/fetch"></a> fetch

###### `model.fetch( [done] )`

Fetches a fresh copy of the model from the server. Internally it calls [sync](#api/model/sync) with a `GET` request.

Fires a [`sync`](#api/events/catalogue) event once the model has been returned.

Returns `this`.

##### Usage:
```language-javascript
var user = new Supportive. Model( { id : 123 },  { endpoint : '/users/' } );

user. fetch( function( error, user ) {
    
    if ( error ) return alert( ':( Something went wrong!' );

    /* do stuff... */
} );
```

#### <a name="api/model/destroy"></a> destroy

###### `model.destroy( [done] )`

Deletes a model from the server. Internally it calls [sync](#api/model/sync) with a `DELETE` request. Once removed from the server, model will remove all attributes, set `model.destroyed = true` and remove all event listeners. If the model is part of a [Collection](#api/collection) it will be removed.

Fires a [`destroy`](#api/events/catalogue) event once the model has be deleted.

##### Usage:
```language-javascript
user. destroy( function( error ) {
    
    if ( error ) return alert( ':( Something went wrong!' );

    console. log( model. destroyed );

    // > true 
} );
```

#### <a name="api/model/to-json"></a> toJSON

###### `model.toJSON()`

Converts a model to it’s JSON format ready for stringification. It doesn't actually stringify the model it just returns an object containing its internal properties. As is described by the [`JSON.stringify`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#toJSON_behavior) API.

#### <a name="api/model/sync"></a> sync

###### `model.sync( request_options, config, [done] )`

The default sync function for a model. Internally this uses our own HTTP request handler and only supports `JSON`. If you wish to handle sync differently it is best to override this method in a subclass.

`config` is the `model.config`.

`request_options` is an object that express the type of request to be sent.

##### Usage:
```language-javascript
{
    method  : 'get'     // The request method i.e. 'get', 'put', 'post', 'delete'.
    url     : ''        // The url to send the request.
    headers : {  }      // An object containing key / value pairs of the headers to set on the request.
    query   : {  }      // An object containing key / value pairs to construct as a query string.
    data    : {  }      // An object to `JSON.stringify` send as the request payload.  
}
```

---

### <a name="api/collection"></a> Supportive.Collection

###### `new Supportive.Collection( [models], [config] )`

A collection is the base-class for working with sets of models and fetching lists of models from server. Collections behave similar to `Arrays` with added sugar for tracking changes and updates on it’s models.


Collections fire events for `'change'`, `'add'` and `'remove'` of it's internal models. Checkout the [events catalogue](#api/events/catalogue) for more details.

The optional `config` argument only has one required property `Model`. By default this is the [Model](#api/model) class. This used to declare the type of `Model` that is managed by the collection and internally is the instance that objects are cast to when calling [`add()`](#api/collection/add), [`create()`](#api/collection/create) or [`fetch()`](#api/collection/fetch).

You can pass any model class that inherits from [Model](#api/model).

As with everything else in Supportive.js, collections are pretty generic and you're welcome to use them if you want.

##### Usage:
```language-javascript
var books = new Supportive. Collection();
```

#### <a name="api/collection/config"></a> config

###### `collection.config`

The config passed during construction.

Config options used internally.

1. `config.endpoint`: the URL of the collection on the server used in `sync`.
2. `config.Model`: the Model class or subclass that the collection holds. (defaults to [Model](#api/model))

#### <a name="api/collection/length"></a> length

###### `collection.length`

Like an `Array`, this is the internal length of models in the collection.

##### Usage:
```language-javascript
console. log( books. length );

// > 0

books. add( { title : 'foobar' } );

console. log( books. length );

// > 1
```

#### <a name="api/collection/indexes"></a> indexes

###### `collection.indexes`

An `object` containing a maps of `model.id` and `model.cid` to their index in the collection. It's unlikely you will ever need to use this.

##### Usage:
```language-javascript
console. log( collection. indexes );

// >    {
            id_to_cid :
                    {
                        '<model_id>' : '<model_cid>'
                    },
            cid_to_index :
                    {
                        '<model_cid>' : '<model_index>'
                    }
        }
```

#### <a name="api/collection/url"></a> url

###### `collection.url()`

Returns the url of the collection's location on the server used during [`fetch()`](#api/collection/fetch). The default function simply returns `config.endpoint`. If you need to do more advanced construction of the collections URL, overwrite this method via a subclass.

As an example, in our own [MessagesCollection](#api/messages-collection) we overwrite the default `url()` to construct the URL from a combination of the `config.user` and `config.endpoint` in order to fetch messages for that user.

The models in the collection by default use the [`url()`](#api/model/url) function to construct their URL from a combination of the `collection.url()` and the `model.id` for `POST`, `PUT` and `GET` operations.

Returns a string.

##### Usage:
```language-javascript
console. log( books. url() );

// > '/books/'
```

#### <a name="api/collection/add"></a> add

###### `collection.add( models )`

Adds the passed-in model attributes or an array of to the collection. Internally it will cast any attributes or models to an instance of `config.Model`.

If the model already exists either by `model.id` or `model.cid` in the collection it will not be added but will be updated.

If a [`comparator`](#api/collection/comparator) has been set on the collection, the models will be added in sorted order.

Fires an `'add'` event for every model added or a `'change'` event for updated models. (see [events](#api/events/catalogue))

Returns an array of added models or a single model if only a set of attributes was passed. If no models were added(e.g. they were updated) the array will be empty or it will return `false` if you only passed a set of attributes.

##### Usage:
```language-javascript
books. add( [ { title : 'The good book' }, { title : 'Another good book' } ] );

// > [ [Model](#api/model), [Model](#api/model) ]

books. add( { title : 'Running out of ideas' } );

// > [Model](#api/model)
```

#### <a name="api/collection/remove"></a> remove

###### `collection.remove( model_id_or_cid )`

Removes a model from the collection but does not delete it from the server.

Fires a [`'remove'`](#api/events/catalogue).

Returns `true` or `false` if the model was removed from the collection.

##### Usage:
```language-javascript
var book = books. add( { title : 'I'm glad naming books isn't my job!' } );

books. get( book. cid );

// > [Model](#api/model)

books. remove( book. cid );

// > true

books. get( book. cid );

// > null
```

#### <a name="api/collection/create"></a> create

###### `collection.create( attributes, [done] )`

Creates a model, adds it to the collection, and saves it to the server. Internally it calls [`model.save()`](#api/models/save) once it has been added to the collection. `done` will be called once it has been successfully saved.

Returns the added [Model](#api/model)

##### Usage:
```language-javascript
books. create( { title : 'A book to savour' }, function( error, book ) {
    
    if ( error ) return alert( ':( Something went wrong!' );

    /* do stuff... */
} );
```

#### <a name="api/collection/fetch"></a> fetch

###### `collection.fetch( [done] )`

Fetches a fresh list of models from the server via a `GET`. Internally it uses [`url()`](#api/collection/url) to send the request.

Fetch doesn't just fetch models from the server and add them to the collection. It actually performs smart updates so any new models will be added, any changed models will be updated, and any removed models will be removed. The collection will fire `'add'`, `'change'` and `'remove'` [events](#api/events/catalogue) accordingly.

If a [`comparator`](#api/collection/comparator) is specified all synced models will be sorted as they are added or modified.

If `done` is passed it will be called with three arguments `error, sync_report, collection`. The sync report is an object that outlines what has changed in the collection.

Here's a sample.

```language-javascript
{
    has_changed : true  // If any changes have occurred to the collection.
    added       : 1     // The count of models added
    updated     : 3     // The count of models that have been updated.
    removed     : 2     // The count of models that have been removed.
}
```

Returns `this`

##### Usage:
```language-javascript
books. fetch( function( error, sync_report ) {
    
    if ( error ) return alert( ':( Something went wrong!' );

    if ( sync_report. added ) alert( 'You have a new message!' );

    /* do stuff... */
} );
```

#### <a name="api/collection/get"></a> get

###### `collection.get( model_id_or_cid )`

Returns a model in the collection by the given [`model.id`](#api/model/id) or [`model.cid`](#api/model/cid).


Returns a model or `null` of the model is not in the collection.

##### Usage:
```language-javascript
var book = books. add( { title : 'Get rich in 7 days!' } );

books. get( book. cid );

// > [Model](#api/model)
```

#### <a name="api/collection/get"></a> at

###### `collection.at( index )`

Returns the model at the specified index or `null` if there isn't one.

##### Usage:
```language-javascript
books. at( 0 );

// > [Model](#api/model)
```

#### <a name="api/collection/index-of"></a> indexOf

###### `collection.indexOf( model_id_or_cid )`

Similar to `Array.indexOf`, only it takes a [`model.id`](#api/model/id) or [`model.cid`](#api/model/cid) and returns the index of that model in collection or `-1` if it doesn't exist.

##### Usage:
```language-javascript
book = books. add( { title : 'Improve your life with minimal effort!' } );

books. indexOf( book. cid );

// > 1
```

#### <a name="api/collection/sort"></a> sort

###### `collection.sort( [comparator] )`

Sorts the collection by running each model through the `comparator`. The comparator function will receive two arguments: the `current_model` and a `comparison_model`. The comparator should return `true` if the `current_model` should go before the `comparison_model` or `false` otherwise.

If no `comparator` has been passed and [`collection.comparator`](#api/collection/comparator) exists, calling sort will use that comparator function instead.

Returns `this`

##### Usage:
```language-javascript
var china_dolls = new Supportive.Collection();

china_dolls. add( [ { size : 2 }, { size : 3 }, { size : 1 } ] );

china_dolls. sort( function( doll, comparison ) {
    
    return doll. size < comparison. size;
} );

// > [ { size : 1 }, { size : 2 }, { size : 3 } ]
```

#### <a name="api/collection/comparator"></a> comparator

###### `collection.comparator`

A comparator function for sorting the collection. By default this is unset and should be added to an instance of a collection or when creating a subclass.

See [sort](#api/collection/sort) for more info.

#### <a name="api/collection/to-json"></a> toJSON

###### `collection.toJSON()`

Loops over all the models in the collection calling [`model.toJSON()`](#api/model.to-json) and returns an array of the results.

See [`model.toJSON()`](#api/model.to-json) for more info.

#### <a name="api/collection/sync"></a> sync

###### `collection.sync( request_options, config, [done] )`

Works exactly as a [models sync](#api/model/sync).

---

### <a name="api/user-model"></a> UserModel

###### `new Supportive.UserModel( [attributes], [config] )`

Inherits from [Model](#api/model).

#### <a name="api/user-model/set-custom-data"></a> setCustomData

###### `model.setCustomData( property, value )`

A convenience method for modifying a users `custom_data` property. Because of the way changes to models are tracked, storing a reference from `model.get` in order to make your changes and call `model.set` with the changed data is a pain. This just does that process internally.

See [`model.set()`](#api/model/set and [`model.get()`](#api/model/get) for more info.

---

### <a name="api/message-model"></a> MessageModel

###### `new Suppportive.MessageModel( [attributes], [config] )`

Inherits from [Model](#api/model).

#### <a name="api/message-model/url"></a> url

###### `model.url()`

Replaces the default [`model.url()`](#api/model/url) method with one that does exactly the same, only it constructs the url by prefixing `config.user.url()` to the normal output.

#### <a name="api/message-model/reply"></a> reply

###### `message.reply( message, [done] )`

Creates a reply to a message and saves it to the server works exactly as `model.save`. Internally this just copies over the messages `thread` and `subject` to the newly created message and [saves](#api/model/save) it.

If the original message is part of a collection the reply will also be added to that collection.

Returns the reply message.

---

### <a name="api/messages-collection"></a> MessagesCollection

###### `new Supportive.MessagesCollection( [attributes], [config] )`

Inherits from [Collection](#api/collection) setting the default model to [MessageModel](#api/message-model).

#### <a name="api/messages-collection/url"></a> url

###### `collection.url()`

Replaces the default[`collection.url()`](#api/collection/url) method with one that does exactly the same, only it constructs the url by prefixing `config.user.url()` to the normal output.

#### <a name="api/messages-collection/comparator"></a> comparator

###### `collection.comparator`

Sets the default comparator to sort messages in date order oldest to newest.

See [sort](#api/collection/sort) for more info.



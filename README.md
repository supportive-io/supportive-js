# Supportive.js

A vanilla, dependency-free browser JS library for the [Supportive.io](http://supportive.io) API.

Read the full documentation [here](http://docs.supportive.io/supportive-js).

## <a name="install"></a> Install

Via bower:
```
bower install --save supportive-js
```

Via npm:
```
npm install --save supportive-js
```

Via Download:

<a href="https://github.com/supportive-io/supportive-js/releases/latest">
```
Download latest version from Github
```
</a>

---

## <a name="quick-start"></a> Quick Start

<p>1. Add the script to your page.</p>

```html
<script type="application/javascript" src="<path_to_supportive_js>/supportive.js"></script>
```

<p>2. Prepare Supportive.js.</p>

```js
var support = new Supportive( 'your_app_id', 'your_api_token' );
```

<p>3. Initialise <a href="http://supportive.io">Supportive.io</a>.</p>

```js
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

```js
support. on( 'message', function( message ) {
    
    /* do stuff... */
} );
```

<p>5. Send a support message.</p>

```js
support. once ( 'init', function (  ) {
    
    support. send( 'Feedback!', 'I love your App.', { page : 'home' }, function( error, message ) {

        if ( error ) return alert( ':( Something went wrong!' );
        
        /* do stuff... */
    } );
} );
```
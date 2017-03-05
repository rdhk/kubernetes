const http = require('http');
const datastore = require( '@google-cloud/datastore' )( {projectId:'prod-pratilipi'} );


const handleRequest = (request,response) => {

	var url = request.url;
	var uri;
	var paramVals = {};
	
	if( url.indexOf( '?' ) == -1  ) {
		uri = url;
	} else {
		uri = url.substring( 0, url.indexOf( '?' ) );
		var queryParams = url.substring( url.indexOf( '?' ) + 1 ).split( '&' );
		for( var i = 0; i < queryParams.length; i++ ) {
			if( queryParams[i].indexOf( '=' ) == -1 )
				continue;
			var param = queryParams[i].substring( 0, queryParams[i].indexOf( '=' ) );
			var val = queryParams[i].substring( queryParams[i].indexOf( '=' ) + 1 );
			paramVals[ param ] = val;
		}
	}

	
	var kind;
	var limit = paramVals['limit'] == null ? 1000 : parseInt(paramVals['limit']);
	
	if( uri == '/pratilipi' )
		kind = 'PRATILIPI';
	
	if( kind == null ) {
		response.writeHead( 404 );
		response.end( 'Api not foud !' );
		return;
	}
	
	
	const query = datastore
			.createQuery( kind )
			.limit( limit );

	datastore.runQuery( query, (err,entities,info) => {
		if( err != null ) {
			console.error( JSON.stringify(err) );
			console.error( entities );
			console.error( info );
		} else {
			entities.forEach( (entity) => { entity.PRATILIPI_ID = entity[datastore.KEY].id } );
			response.end( JSON.stringify({entities:entities,cursor:info.endCursor}) );
		}
	});

};

http.createServer( handleRequest ).listen(80);

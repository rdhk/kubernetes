const http = require('http');
const datastore = require('@google-cloud/datastore')( {projectId:'prod-pratilipi'} );

const schemas = {
	PRATILIPI: {
		PRATILIPI_ID:				{ type:'INTEGER',	mode:'REQUIRED' },
		TITLE:						{ type:'STRING',	mode:'NULLABLE' },
		TITLE_EN:					{ type:'STRING',	mode:'NULLABLE' },
		LANGUAGE:					{ type:'STRING',	mode:'REQUIRED' },
		AUTHOR_ID:					{ type:'INTEGER',	mode:'REQUIRED' },
		SUMMARY:					{ type:'STRING',	mode:'NULLABLE' },
		PRATILIPI_TYPE:				{ type:'STRING',	mode:'REQUIRED' },
		CONTENT_TYPE:				{ type:'STRING',	mode:'REQUIRED' },
		STATE:						{ type:'STRING',	mode:'REQUIRED' },
		COVER_IMAGE:				{ type:'BOOLEAN',	mode:'REQUIRED' },
		LISTING_DATE:				{ type:'TIMESTAMP',	mode:'REQUIRED' },
		LAST_UPDATED:				{ type:'TIMESTAMP',	mode:'REQUIRED' },
		WORD_COUNT:					{ type:'INTEGER',	mode:'REQUIRED' },
		IMAGE_COUNT:				{ type:'INTEGER',	mode:'REQUIRED' },
		PAGE_COUNT:					{ type:'INTEGER',	mode:'REQUIRED' },
		CHAPTER_COUNT:				{ type:'INTEGER',	mode:'REQUIRED' },
		REVIEW_COUNT:				{ type:'INTEGER',	mode:'REQUIRED' },
		RATING_COUNT:				{ type:'INTEGER',	mode:'REQUIRED' },
		TOTAL_RATING:				{ type:'INTEGER',	mode:'REQUIRED' },
		READ_COUNT_OFFSET:			{ type:'INTEGER',	mode:'REQUIRED' },
		READ_COUNT:					{ type:'INTEGER',	mode:'REQUIRED' },
		FB_LIKE_SHARE_COUNT_OFFSET:	{ type:'INTEGER',	mode:'REQUIRED' },
		FB_LIKE_SHARE_COUNT:		{ type:'INTEGER',	mode:'REQUIRED' }
	}
};


http.createServer( (request,response) => {

	var url = require('url').parse( request.url, true );
	
	if( url.pathname == '/pratilipi' )
		kind = 'PRATILIPI';
	else if( url.pathname == '/pratilipi/list' )
		runQuery( 'PRATILIPI',
				url.query['filter'] == null ? [] : JSON.parse( url.query['filter'] ),
				url.query['order'] == null ? [] : JSON.parse( url.query['order'] ),
				url.query['limit'] == null ? 1000 : parseInt( url.query['limit'] ),
				url, response );
	else
		dispatch404( url, response );

}).listen(80);


function runQuery( kind, filters, orders, limit, url, response ) {

	var schema = schemas[kind];
	var query = datastore.createQuery( kind );

	filters.forEach( (filter) => {
		
		var property = filter[0];
		var operator = filter[1];
		var value = filter[2];
		
		switch( operator ) {
			case "eq": operator = '='; 	break;
			case "lt": operator = '<'; 	break;
			case "le": operator = '<='; break;
			case "gt": operator = '>'; break;
			case "ge": operator = '>='; break;
		}
		
		if( schema[property].type == 'TIMESTAMP' )
			value = new Date( value );
		
		query = query.filter( property, operator, value );
	
	});

	orders.forEach( (order) => {
		if( order.startsWith( '-' ) )
			query = query.order( order.substr(1), {descending:true} );
		else
			query = query.order( order );
	});

	query = query.limit( limit );
	
	datastore.runQuery( query, (err,entities,info) => {
		if( err != null )
			dispatch500( err, url, response );
		else
			dispatchEntities( kind, entities, info, url, response );
	});

}

function dispatchEntities( kind, entities, info, url, response ) {
	
	var schema = schemas[kind];
	
	entities.forEach( (entity) => {
		Object.keys( entity ).forEach( (property) => {
			if( schema[property] == null )
				delete entity[property];
			else if( schema[property].type == 'INTEGER' && entity[property] == null )
				entity[property] = 0;
		});
		if( schema[kind + '_ID'].type == 'INTEGER' )
			entity[kind + '_ID'] = entity[datastore.KEY].id;
		else
			entity[kind + '_ID'] = entity[datastore.KEY].name;
	});
	
	response.end( JSON.stringify({entities:entities,cursor:info.endCursor}) );
	console.log( entities.length + ' entities returned for ' + JSON.stringify( url ) );
	
}

function dispatch404( url, response ) {
	console.error( '404 error returned for ' + JSON.stringify( url ) );
	response.writeHead( 404 );
	response.end( 'Api not found !' );
}

function dispatch500( error, url, response ) {
	console.error( JSON.stringify(err) );
	console.error( '500 error returned for ' + JSON.stringify( url ) );
	response.writeHead( 500 );
	response.end( 'Some exception occurred at server. Please try again !' );
}

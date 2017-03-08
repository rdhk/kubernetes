const http = require('http');
const bigquery = require( '@google-cloud/bigquery' )( {projectId:'pratilipi-157910'} );

const dataset = bigquery.dataset( 'Global' );
const apiHost = 'http://10.103.242.0';


const tables = {
	PRATILIPI: { api:'/pratilipi/list', sortBy:'LAST_UPDATED', batchSize:100, lastValue:null }
};

Object.keys( tables ).forEach( (kind) => {
	var table = tables[kind];
	var queryStr = 'SELECT MAX(' + table.sortBy + ') as value FROM [pratilipi-157910:Global.' + kind + ']';
	bigquery.query( queryStr, (err,rows) => {
		if( !err ) {
			if( rows )
				table.lastValue = rows[0]['value']['value'];
			setInterval( () => { fn( kind ); }, 300000 ); // Run every 5 mins
		} else {
			console.error( JSON.stringify(err) );
		}
	});
});


function fn( kind ) {

	var table = tables[kind];
	var url = apiHost + table.api + '?';
	if( table.lastValue != null )
		url = url + 'filter=[["' + table.sortBy + '","gt","' + table.lastValue + '"]]' + '&';
	url = url + 'order=["' + table.sortBy + '"]' + '&limit=' + table.batchSize;
	
	http.get( url, (resp) => {
		var buffer = "";
		resp.on( "data", (chunk) => {buffer += chunk;} );
		resp.on( "end", () => { insertAll( kind, JSON.parse( buffer ).entities ); });
	}).on( 'error', (err) => {
		console.error( JSON.stringify(err) );
	});
	
};

function insertAll( kind, entities ) {
	
	if( entities.length == 0 )
		return;

	var rows = [];
	entities.forEach( (entity) => {
		
		var insertId;
		
		if( kind == 'PRATILIPI' ) {
			entity['COVER_IMAGE'] = entity['COVER_IMAGE'] != null;
			insertId = entity['PRATILIPI_ID'].toString();
		}
		
		rows.push({ insertId:insertId, json:entity });
		
	});

	dataset.table(kind).insert( rows, { raw:true }, (err,apiResponse) => {
		if(err) {
			if( err.name === 'PartialFailureError' ) {
				err.errors.forEach( (err1) => {
					err1.errors.forEach( (err2) => {
						if( err2.reason != 'stopped' ) {
							console.error( JSON.stringify( err1.row ) );
							console.error( err2.reason );
						}
					});
				});
			} else {
				console.error( err );
			}
		} else {
			var table = tables[kind];
			table.lastValue = entities[entities.length -1][table.sortBy];
			console.log( rows.length + ' ' + kind + ' records inserted !');
		}
	});
	
}
const fs = require('fs');
const readline = require('readline');
const http = require('http');
const storage = require('@google-cloud/storage')({ projectId:'pratilipi-157910' }).bucket('datastore-archive');

const daHost = 'http://10.103.242.0';


const tables = {
	PRATILIPI:   { id:'PRATILIPI_ID',   api:'/pratilipi/list',   sortBy:'LAST_UPDATED', lastValue:'', batchSize:1000 },
	USER_AUTHOR: { id:'USER_AUTHOR_ID', api:'/user-author/list', sortBy:'FOLLOW_DATE',  lastValue:'', batchSize:1000 }
};

Object.keys( tables ).forEach( (kind) => {
	const file = storage.file( kind );
	file.exists( (err,exists) => {
		if(err) {
			console.log( JSON.stringify(err) );
		} else if( exists ) {
			console.log( 'Downloading ' + kind + ' from DataStore ...' );
			file.download( {destination:kind}, (err) => {
				if(err)
					console.log( JSON.stringify(err) );
				else
					schedule( kind );
			});
		} else {
			schedule( kind );
		}
	});
});

var timeout = 0;
function schedule( kind ) {
	timeout = timeout + 60 * 1000;
	setTimeout( () => {
		setInterval( () => {
			readFromFile( kind );
		}, 15 * 60 * 1000 ); // Update every 15 minutes
	}, timeout );
}


function readFromFile( kind ) {

	if( fs.existsSync( kind ) ) {
		
		const table = tables[kind];
		const entities = {};
		
		readline.createInterface({
			input: fs.createReadStream(kind)
		}).on( 'line', (line) => {
			const json = JSON.parse( line );
			entities[ json[table.id] ] = json;
			if( table.lastValue < json[table.sortBy] )
				table.lastValue = json[table.sortBy];
		}).on( 'close', () => {
			updateFromDataStore( kind, entities );
		});

	} else {
		
		updateFromDataStore( kind, {} );
		
	}
	
}

function updateFromDataStore( kind, entities ) {
	
	const table = tables[kind];
	
	var url = daHost + table.api + '?';
	if( table.lastValue != '' )
		url = url + 'filter=[["' + table.sortBy + '","gt","' + table.lastValue + '"]]' + '&';
	url = url + 'order=["' + table.sortBy + '"]' + '&limit=' + table.batchSize;
	
	http.get( url, (resp) => {
		var buffer = "";
		resp.on( "data", (chunk) => {buffer += chunk;} );
		resp.on( "end", () => {
			const updates = JSON.parse( buffer ).entities;
			if( updates.length == 0 )
				return;
			updates.forEach( (json) => {
				entities[ json[table.id] ] = json;
			});
			writeToFile( kind, entities );
		});
	}).on( 'error', (err) => {
		console.error( JSON.stringify(err) );
	});
	
}

function writeToFile( kind, entities ) {
	
	var wStream = fs.createWriteStream( kind, {
		flags: 'a' // 'a' means appending (old data will be preserved)
	});

	var gcsStream = storage.file( kind ).createWriteStream();
	
	console.log( 'Writing ' + Object.keys( entities ).length + ' ' + kind + ' entities ...' );
	
	Object.values( entities ).forEach( (json) => {
		const str = JSON.stringify( json );
		wStream.write( str + '\n' );
		gcsStream.write( str + '\n' );
	});
	
	wStream.end();
	gcsStream.end();
	
	storage.file( kind ).copy( kind + '/' + new Date().toString() );
	
}


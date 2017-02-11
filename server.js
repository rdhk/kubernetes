const http = require('http');
const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;


const Storage = require('@google-cloud/storage');
const Logging = require('@google-cloud/logging');

const project = { projectId: 'pratilipi-157909' };

const storageClient = Storage(project);
const bucket = storageClient.bucket('static.pratilipi.com');

const loggingClient = Logging(project);
const log = loggingClient.log('image-server');
const metadata = { resource: { type: 'global' } };


const cache = {};


const handleRequest = ( request, response ) => {


	if( request.url == '/' ) {
		response.writeHead(200);
		response.end( execSync('ls -al /home') );
		return;
	}

	
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



	var fileName;

	if( uri == '/author/image' ) {
		
		if( paramVals['authorId'] == null || paramVals[ 'version' ] == null ) {
			dispatch404( response );
			return;
		}
		
		fileName = 'author-image-' + paramVals['authorId'] + '-' + paramVals[ 'version' ];
		if( paramVals['width'] != null )
			fileName = fileName + '-' + paramVals[ 'width' ];
		
		var fileMeta = fileMetaCache.get( fileName );
		if( fileMeta != null ) {
			dispatchFile( fileName, fileMeta );
			return;
		}
		
		fileName = 'author-image-' + paramVals['authorId'] + '-' + paramVals[ 'version' ];
		fileMeta = fileMetaCache.get( fileName );
		if( fileMeta == null )
		
		if( fileMeta == null && paramVals['width'] != null ) {
			var originalFileName = 'author-image-' + paramVals['authorId'] + '-' + paramVals[ 'version' ];
			
		}
				
	}
	
	if( ! fs.existsSync( '/home/' + fileName + '.jpg' ) ) {
		var file = bucket.file( 'author/' + paramVals['authorId'] + '/images/profile/' + paramVals[ 'version' ] );
		console.log( 'Downloading ' + 'author/' + paramVals['authorId'] + '/images/profile/' + paramVals[ 'version' ] + ' ...' );
		file.download( { destination: '/home/' + fileName + '.jpg' }, function( err ) {
			console.log(err);
			console.log( 'Download finished ...' );
			
			dispatch( '/home/' + fileName, paramVals['width'], response );
		});
	} else {
			dispatch( '/home/' + fileName, paramVals['width'], response );
	}
	
		
};

function dispatch( fileName, width, response ) {

	if( width != null ) {
		var resize = width + 'x' + width;
		if( ! fs.existsSync( fileName + '-' + resize + '.jpg' ) )
			execSync( 'convert ' + fileName + '.jpg -resize ' + resize + '! -unsharp 0x0.55+0.55+0.008 -quality 50% ' + fileName + '-' + resize + '.jpg' );
		fileName = fileName + '-' + resize;
	}
	
	var img = fs.readFileSync( fileName + '.jpg' );
//	response.writeHead( 200, {'Content-Type': 'image/png' } );
	response.writeHead( 200 );
	response.end( img, 'binary' );
	
}

function dispatch404( response ) {
	
}

http.createServer( handleRequest ).listen(8080);

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


const fileMetaCache = {};


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


	if( uri == '/author/image' ) {
		
		if( paramVals['authorId'] == null ) {
			
			dispatch( 'author/default/images/profile',
					'/home/author-profile-default',
					paramVals[ 'width' ] == null ? null : paramVals[ 'width' ] + 'x' + paramVals[ 'width' ],
					response );
			
		} else if( paramVals[ 'version' ] == null ) {
			
			dispatch404( response );
			return;
			
		} else {
			
			dispatch( 'author/' + paramVals['authorId'] + '/images/profile/' + paramVals[ 'version' ],
					'/home/author-profile-' + paramVals['authorId'] + '-' + paramVals[ 'version' ],
					paramVals[ 'width' ] == null ? null : paramVals[ 'width' ] + 'x' + paramVals[ 'width' ],
					response );
			
		}
			
	} else if( uri == '/author/cover' ) {
		
		if( paramVals['authorId'] == null ) {
			
			dispatch( 'author/default/images/cover',
					'/home/author-cover-default',
					paramVals[ 'width' ] == null ? null : paramVals[ 'width' ] + 'x' + paramVals[ 'width' ],
					response );
			
		} else if( paramVals[ 'version' ] == null ) {
			
			dispatch404( response );
			return;
			
		} else {
			
			dispatch( 'author/' + paramVals['authorId'] + '/images/cover/' + paramVals[ 'version' ],
					'/home/author-cover-' + paramVals['authorId'] + '-' + paramVals[ 'version' ],
					paramVals[ 'width' ] == null ? null : paramVals[ 'width' ] + 'x' + paramVals[ 'width' ],
					response );
			
		}
		
	} else {
		
		dispatch404( response );
		
	}

};



function dispatch( gcsFileName, fileName, resize, response ) {
	
	if( ( resize != null && fileMetaCache[ fileName + '-' + resize ] != null )
			|| ( resize == null && fileMetaCache[ fileName ] != null ) ) {

		var fileMeta = resize == null
				? fileMetaCache[ fileName ]
				: fileMetaCache[ fileName + '-' + resize ];
		
		fileName = resize == null
				? fileName + fileMeta[ 'ext' ]
				: fileName + '-' + resize + fileMeta[ 'ext' ];
		
		var img = fs.readFileSync( fileName );
		response.writeHead( 200, {
			'Content-Type': fileMeta[ 'type' ],
			'Cache-Control': 'max-age=315360000', // 10 Years
			'ETag': fileName } );
		response.end( img, 'binary' );
		
	} else if( resize != null && fileMetaCache[ fileName ] != null ) {
		
		console.log( 'Resizing ' + fileName + ' ...' );
		
		var fileType = fileMetaCache[ fileName ][ 'type' ];
		var fileExt = getFileExt( fileType );
		
		if( fileExt == '.png') {
			execSync( 'convert '
					+ fileName + fileExt + ' '
					+ '-resize ' + resize + '! '
					+ fileName + '-' + resize + fileExt );
		} else {
			execSync( 'convert '
					+ fileName + fileExt + ' '
					+ '-resize ' + resize + '! '
					+ '-unsharp 0x0.55+0.55+0.008 '
					+ '-quality 50% '
					+ fileName + '-' + resize + fileExt );
		}
		
		fileMetaCache[ fileName + '-' + resize ] = {
			'ext': fileExt,
			'type': fileType,
			'lastAccessed': new Date()
		};
		
		dispatch( gcsFileName, fileName, resize, response );
		
	} else if( fileMetaCache[ fileName ] == null ) {

		console.log( 'Downloading ' + gcsFileName + ' ...' );
		
		var file = bucket.file( gcsFileName );
		
		file.getMetadata( function( err, metadata, apiResponse ) {
			var fileType = metadata[ 'contentType' ];
			if( fileType == null ) {
				console.log( 'ContentType not set for ' + gcsFileName );
				fileType = 'image/jpeg';
			}
			var fileExt = getFileExt( fileType );
			file.download( { destination: fileName + fileExt }, function( err ) {
				if( err == null ) {
					// TODO: Compress image
					fileMetaCache[ fileName ] = {
						'ext': fileExt,
						'type': fileType,
						'lastAccessed': new Date()
					};
					dispatch( gcsFileName, fileName, resize, response );
				} else {
					console.log( err );
					// TODO: Dispatch error
				}
			});
		});
		
	}
	
}

function getFileExt( fileType ) {
	if( fileType.toLowerCase() == 'image/jpeg' )
		return '.jpg';
	else if( fileType.toLowerCase() == 'image/png' )
		return '.png';
	else if( fileType.toLowerCase() == 'image/x-icon' )
		return '.ico';
	else {
		console.log( 'Unsupported file type: ' + fileType );
		return '.jpg';
	}
}

function dispatch404( response ) {
	response.writeHead( 404 );
	response.end( 'Image not found !' );
}


http.createServer( handleRequest ).listen(80);

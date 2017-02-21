const http = require('http');
const fs = require('fs');
const execSync = require('child_process').execSync;


const Storage = require('@google-cloud/storage');

const project = { projectId: 'pratilipi-157909' };

const storageClient = Storage(project);
const bucket = storageClient.bucket('static.pratilipi.com');


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
		
		if( paramVals[ 'authorId' ] == null || paramVals[ 'version' ] == null ) {
			
			dispatch( 'author/default/images/profile',
					'/home/author-profile-default',
					paramVals[ 'width' ] == null ? null : paramVals[ 'width' ] + 'x' + paramVals[ 'width' ] + '!',
					request.headers[ 'if-none-match' ],
					response );
			
		} else {
			
			dispatch( 'author/' + paramVals['authorId'] + '/images/profile/' + paramVals[ 'version' ],
					'/home/author-profile-' + paramVals['authorId'] + '-' + paramVals[ 'version' ],
					paramVals[ 'width' ] == null ? null : paramVals[ 'width' ] + 'x' + paramVals[ 'width' ] + '!',
					request.headers[ 'if-none-match' ],
					response );
			
		}
			
	} else if( uri == '/author/cover' ) {
		
		if( paramVals['authorId'] == null || paramVals[ 'version' ] == null ) {
			
			dispatch( 'author/default/images/cover',
					'/home/author-cover-default',
					paramVals[ 'width' ] == null ? null : paramVals[ 'width' ],
					request.headers[ 'if-none-match' ],
					response );
			
		} else {
			
			dispatch( 'author/' + paramVals['authorId'] + '/images/cover/' + paramVals[ 'version' ],
					'/home/author-cover-' + paramVals['authorId'] + '-' + paramVals[ 'version' ],
					paramVals[ 'width' ] == null ? null : paramVals[ 'width' ],
					request.headers[ 'if-none-match' ],
					response );
			
		}
		
	} else {
		
		dispatch404( response );
		
	}

};



function dispatch( gcsFileName, fileName, resize, eTag, response ) {
	
	if( ( resize != null && fileMetaCache[ fileName + '-' + resize ] != null )
			|| ( resize == null && fileMetaCache[ fileName ] != null ) ) {

		var fileMeta = resize == null
				? fileMetaCache[ fileName ]
				: fileMetaCache[ fileName + '-' + resize ];
		
		if( eTag == fileMeta[ 'eTag' ] ) {

			response.writeHead( 304 );
			response.end();

		} else {
			
			fileName = resize == null
					? fileName + fileMeta[ 'ext' ]
					: fileName + '-' + resize + fileMeta[ 'ext' ];
			
			var img = fs.readFileSync( fileName );
			response.writeHead( 200, {
					'Content-Type': fileMeta[ 'type' ],
					'Cache-Control': 'max-age=315360000, public', // 10 Years
					'ETag': fileMeta[ 'eTag' ] } );
			response.end( img, 'binary' );
			
		}
		
		fileMeta[ 'lastAccessed' ] = new Date();
		
	} else if( resize != null && fileMetaCache[ fileName ] != null ) {
		
		console.log( 'Resizing ' + fileName + ' ...' );
		
		var fileType = fileMetaCache[ fileName ][ 'type' ];
		var fileExt = getFileExt( fileType );

		var command = 'convert ' + fileName + fileExt + ' ' + '-resize ' + resize + ' ';
		if( fileExt != '.png')
			command = command + '-unsharp 0x0.55+0.55+0.008 ' + '-quality 50% '
		command = command + fileName + '-' + resize + fileExt;

		exec( command, (error, stdout, stderr) => {
			
			if( error != null ) {
				dispatch500( error, response );
				return;
			}
			
			fileMetaCache[ fileName + '-' + resize ] = {
				'type': fileType,
				'ext': fileExt,
				'eTag': fileMetaCache[ fileName ][ 'eTag' ],
				'lastAccessed': new Date()
			};
			
			dispatch( gcsFileName, fileName, resize, eTag, response );
			
		});
		
	} else if( fileMetaCache[ fileName ] == null ) {

		console.log( 'Downloading ' + gcsFileName + ' ...' );
		
		var file = bucket.file( gcsFileName );
		
		file.getMetadata( function( err, metadata, apiResponse ) {
			
			if( err != null ) {
				dispatch500( err, response );
				return;
			}
			
			var fileType = metadata[ 'contentType' ];
			if( fileType == null ) {
				console.error( 'ContentType not set for ' + gcsFileName );
				fileType = 'image/jpeg';
			}
			var fileExt = getFileExt( fileType );
			
			file.download( { destination: fileName + fileExt }, function( err ) {
				
				if( err != null ) {
					dispatch500( err, response );
					return;
				}
				
				fileMetaCache[ fileName ] = {
					'type': fileType,
					'ext': fileExt,
					'eTag': metadata[ 'etag' ],
					'lastAccessed': new Date()
				};
				
				dispatch( gcsFileName, fileName, resize, eTag, response );
				
			});
			
		});
		
	}
	
}

function getFileExt( fileType ) {
	if( fileType.toLowerCase() == 'image/jpeg' )
		return '.jpg';
	else if( fileType.toLowerCase() == 'image/png' )
		return '.png';
	else if( fileType.toLowerCase() == 'image/bmp' )
		return '.bmp';
	else if( fileType.toLowerCase() == 'image/x-icon' )
		return '.ico';
	else {
		console.error( 'Unsupported file type: ' + fileType );
		return '.jpg';
	}
}

function dispatch404( response ) {
	response.writeHead( 404 );
	response.end( 'Image not found !' );
}

function dispatch500( error, response ) {
	console.error( error );
	response.writeHead( 500 );
	response.end( 'Some exception occurred at server. Please try again !' );
}

http.createServer( handleRequest ).listen(80);

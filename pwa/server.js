const http = require( 'http' );
const fs = require( 'fs' );

const handleRequest = ( request, response ) => {

	var url = request.url;
	var uri = url.indexOf( '?' ) == -1 ? url : url.substring( 0, url.indexOf( '?' ) );
	
	var file = fs.readFileSync( fileName );
	response.writeHead( 200, { 'Cache-Control': 'max-age=315360000, public' } ); // 10 Years
	response.end( file, 'binary' );

};

http.createServer( handleRequest ).listen( 80 );

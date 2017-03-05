const http = require('http');
const datastore = require( '@google-cloud/bigquery' )( {projectId: 'pratilipi-157910'} );


/*const handleRequest = (request,response) => {
	http.get( '10.59.254.193', )

};

http.createServer( handleRequest ).listen(80);
*/

http.get( 'http://10.59.254.193/pratilipi', (res) => {
	
	console.log( res );
	
});

const server = require('./server/server');
const config = require('./server/config');
require('./server/socket/socketServer');

const PORT = config.PORT || 8000;

server.listen(PORT, () => console.log(`Server listening on port ${PORT}...`));

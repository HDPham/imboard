const server = require('./server/server');
const config = require('./server/config');
require('./server/socket/socketServer');

const PORT = config.PORT || 8000;
console.log(config.NODE_ENV);
server.listen(PORT, () => console.log(`Server listening on port ${PORT}...`));

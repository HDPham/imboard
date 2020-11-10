const server = require('./server');
const config = require('./config');
require('./io-server');

const PORT = config.PORT || 5000;

server.listen(PORT, () => console.log(`Server listening on port ${PORT}...`));

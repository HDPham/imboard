import { io } from 'socket.io-client';

const coupSocket =
  process.env.NODE_ENV === 'production'
    ? io('/coup', { autoConnect: false })
    : io('http://localhost:8000/coup', { autoConnect: false });
const dssSocket =
  process.env.NODE_ENV === 'production'
    ? io('/dss', { autoConnect: false })
    : io('http://localhost:8000/dss', { autoConnect: false });

export { coupSocket, dssSocket };

process.env.FUNCTIONS_EMULATOR = 'true';
const app = require('./auth/app');
app.listen(9000, () => {
    console.log('App successfully started on port 9000');
});

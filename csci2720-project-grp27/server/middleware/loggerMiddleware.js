// a simple logging file
// this file can help us to see what's happening in the backend while testing
export const requestLogger = (req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
};

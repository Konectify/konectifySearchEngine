


const logger =(err,req, res, next)=>{
    console.log("THIS IS THE ERROR HANDLER", err.stack)
}
module.exports = logger 
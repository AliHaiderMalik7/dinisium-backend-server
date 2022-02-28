const AuditLogs = require('../model/auditLogs');

const createLogs = async(req,res,next)=>{
    try {
        let body = {...req.body};
        body.created_at = new Date();
        body.updated_at = new Date();
        await AuditLogs.saveLogs(body);
        res.status(200).json({success:false,data:null,msg:"logs created successfully"});
    } catch (error) {
        res.status(403).json({success: false,msg: error.message})
    }
}

const getLogs = async(req, res, next)=>{
    try {
        const logs = (await AuditLogs.findLogs()).rows;
        res.status(200).json({success:true,data:logs})
    } catch (error) {
        res.status(500).json({success:false,msg:error.message})
    }
}

module.exports = {
    createLogs,
    getLogs
}
var Connection = require('tedious').Connection;
var Request = require('tedious').Request
var TYPES = require('tedious').TYPES;

const executeSQL = (context, verb, entity, payload) => {
    var result = "";
    const paramPayload = (payload != null) ? JSON.stringify(payload) : '';
    context.log(payload);

    // Create Connection object
    const connection = new Connection({
        server: process.env["db_server"],
        authentication: {
            type: 'default',
            options: {
                userName: process.env["db_user"],
                password: process.env["db_password"],
                validateBulkLoadParameters: false
            }
        },
        options: {
            database: process.env["db_database"],
            encrypt: true
        }
    });

    // Create the command to be executed
    const request = new Request(`dbo.${entity}`, (err) => {
        if (err) {
            context.log.error(err);
            context.res.status = 500;
            context.res.body = "Error executing T-SQL command";
        } else {
            context.res = {
                body: result
            }
        }
        context.done();
    });
    if (payload)
        request.addParameter('Json', TYPES.NVarChar, paramPayload, Infinity);

    // Handle 'connect' event
    connection.on('connect', err => {
        if (err) {
            context.log.error(err);
            context.res.status = 500;
            context.res.body = "Error connecting to Azure SQL query";
            context.done();
        }
        else {
            // Connection succeeded so execute T-SQL stored procedure
            // if you want to executer ad-hoc T-SQL code, use connection.execSql instead
            connection.callProcedure(request);
        }
    });

    // Handle result set sent back from Azure SQL
    request.on('row', columns => {
        columns.forEach(column => {
            result += column.value;
        });
    });

    // Connect
    connection.connect();
}

module.exports = function (context, req) {
    const method = req.method.toLowerCase();
    var payload = null;
    var entity = "";
    var category = context.bindingData.category;
    var criteria = context.bindingData.criteria;
    var id = context.bindingData.id;


    switch (method) {
        case "get":
            switch (category) {
                case 'staff':
                    switch (criteria) {
                        case 'list':
                            entity = "get_staffs";
                            break;
                        case 'id':
                            if (req.params.id) {
                                entity = "get_staffbyID"
                                payload = { "StaffID": req.params.id };
                            } else {
                                entity = "get_staffs"
                            }
                            break;
                        case 'bldg':
                            if (req.params.id) {
                                entity = "get_staffByBldg"
                                payload = { "BldgID": req.params.id };
                            }
                            break;
                    }
                    break;
                case 'bldg':
                    if (criteria = 'list') {
                        entity = "get_BldgList"
                    }
                    break;
            }
            break;
        case "patch":
            entity = "set_PhotobyPID"
            payload = req.body;
            if (req.params.id)
                payload.id = req.params.id;
            break;
        case "post":
            entity = "createRoster"
            payload = req.body;
            break;
    }

    executeSQL(context, method, entity, payload)
}
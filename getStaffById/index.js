
module.exports = async function (context, req, staffs) {
    context.log('JavaScript HTTP trigger and SQL input binding function processed a request.');

    context.res = {
        // status: 200, /* Defaults to 200 */
        mimetype: "application/json",
        body: staffs
    };
}
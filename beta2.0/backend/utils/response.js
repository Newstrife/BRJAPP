exports.success = (res, data) => res.json({ code: 0, message: 'success', data });
exports.fail = (res, msg) => res.json({ code: 500, message: msg });

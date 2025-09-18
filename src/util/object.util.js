function pickFields(obj, fields) {
    return fields.reduce((acc, field) => {
        if (obj[field] !== undefined) acc[field] = obj[field];
        return acc;
    }, {});
}

module.exports = { pickFields };
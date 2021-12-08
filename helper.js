function getOffset(currentPage = 1, listPerPage) {
  return (currentPage - 1) * [listPerPage];
}

function emptyOrRows(rows) {
  if (!rows) {
    return [];
  }
  return rows;
}

function groupBy(arrayData, property) {
  const group_to_values = arrayData.reduce((obj, item, index) => {
    obj[item[`${property}`]] = obj[item[`${property}`]] || [];
    obj[item[`${property}`]].push(item);
    return obj;
  }, {});

  const groups = Object.keys(group_to_values).map((key) => {
    return {
      [property]: Number(key),
      data: group_to_values[key],
    };
  });

  return groups;
}

function applyArray(primaryarray, secondaryarray) {
  Array.prototype.push.apply(primaryarray, secondaryarray);
}

module.exports = {
  getOffset,
  emptyOrRows,
  groupBy,
  applyArray,
};

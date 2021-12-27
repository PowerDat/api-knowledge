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

async function compareArrayToAdd(firstArray, secondArray, typeName) {
  const results = firstArray.map((item) => {
    const arrayResult = secondArray.filter(
      (itemInArray) => itemInArray[`${typeName}`] === item[`${typeName}`]
    );
    return {
      ...item,
      [secondArray[0].output_id
        ? "innovations"
        : secondArray[0].impacts
        ? "impacts"
        : secondArray[0].concept_proposal_name_th
        ? "concepts"
        : secondArray[0].bcg_name
        ? "bcg"
        : secondArray[0].sdgs_name
        ? "sdgs"
        : secondArray[0].curve_name
        ? "curve"
        : secondArray[0].cluster_name
        ? "cluster"
        : "knowledges"]: arrayResult,
    };
  });
  return results;
}

function applyArray(primaryarray, secondaryarray) {
  Array.prototype.push.apply(primaryarray, secondaryarray);
}

module.exports = {
  compareArrayToAdd,
  getOffset,
  emptyOrRows,
  groupBy,
  applyArray,
};

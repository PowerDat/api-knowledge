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
<<<<<<< HEAD
      [secondArray[0].output_name  
=======
      [secondArray[0].output_name
>>>>>>> 0e7fd73511af2b45d9556d21c8d169cc4ebeaa54
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
        : secondArray[0].knowledge_name
        ? "knowledges"
<<<<<<< HEAD
        : ""]: arrayResult,
=======
        : "null"]: arrayResult,
>>>>>>> 0e7fd73511af2b45d9556d21c8d169cc4ebeaa54
    };
  });
  return results;
}

function applyArray(primaryarray, secondaryarray) {
  Array.prototype.push.apply(primaryarray, secondaryarray);
}

function generateRandomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

module.exports = {
  compareArrayToAdd,
  getOffset,
  emptyOrRows,
  groupBy,
  applyArray,
  generateRandomColor,
};

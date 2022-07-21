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

function groupLink(arrayData) {
  const link = arrayData.map((link) => {
    let fromlink = [],
      tolink = [];

    link.data.map((val) => {
      fromlink.push({
        from: val.id,
      });
      tolink.push({
        to: val.id,
      });
    });

    const first = fromlink.pop();
    const last = tolink.shift();

    // console.log(first);
    // console.log(last);

    let obj = fromlink.map((item, i) => Object.assign({}, item, tolink[i]));

    let objlast = [first].map((item, i) => Object.assign({}, item, [last][i]));
    console.log(obj);
    console.log(objlast);

    // applyArray(obj, objlast);

    return {
      links: obj,
    };
  });

  // console.log(re_link);
  let links = [];
  link.map((val) => {
    val.links.map((item) => {
      links.push(item);
    });
  });

  return links;
}

async function compareArrayToAdd(firstArray, secondArray, typeName) {
  const results = firstArray.map((item) => {
    const arrayResult = secondArray.filter(
      (itemInArray) => itemInArray[`${typeName}`] === item[`${typeName}`]
    );
    return {
      ...item,
      [secondArray[0].output_name
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
        : "null"]: arrayResult,
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

const uniqArrMultipleField = (arrayData, firstField, secondField) => {
  const Uniq = arrayData.filter(
    (tag, index, array) =>
      array.findIndex(
        (t) =>
          t[`${firstField}`] == tag[`${firstField}`] &&
          t[`${secondField}`] == tag[`${secondField}`]
      ) == index
  );
  return Uniq;
};

const mergeArrWithSameKey = (firstArr, secondArr, field, fieldName) => {
  const results = firstArr.map((item) => {
    const arrayResult = secondArr.filter(
      (list) => Number(list[`${field}`]) === Number(item[`${field}`])
    );
    return { ...item, [fieldName]: arrayResult };
  });
  return results;
};

const handleNameAndImage = (projectype, type) => {
  if (projectype === 1) {
    if (type === "label") {
      return "งานวิจัย";
    }
    if (type === "image") {
      return "https://researcher.kims-rmuti.com/icon/R.jpg";
    }
  }

  if (projectype === 2) {
    if (type === "label") {
      return "งานบริการวิชาการ";
    }
    if (type === "image") {
      return "https://researcher.kims-rmuti.com/icon/AS.jpg";
    }
  }

  if (projectype === 5) {
    if (type === "label") {
      return "งานบริการวิชาการ (U2T)";
    }
    if (type === "image") {
      return "https://researcher.kims-rmuti.com/icon/U2T.jpg";
    }
  }
};

module.exports = {
  compareArrayToAdd,
  getOffset,
  emptyOrRows,
  groupBy,
  applyArray,
  generateRandomColor,
  mergeArrWithSameKey,
  uniqArrMultipleField,
  handleNameAndImage,
  groupLink
};

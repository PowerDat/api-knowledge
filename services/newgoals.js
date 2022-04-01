const db = require("./db");
const helper = require("../helper");

async function getNewGoals(paramQuery) {
  console.log(paramQuery);
  const goals = await db.query(
    `SELECT * FROM bd_sum_goals where type =${
      paramQuery.goal_id
        ? `"${
            paramQuery.goal_id == 1
              ? "bcg"
              : paramQuery.goal_id == 2
              ? "sdg"
              : paramQuery.goal_id == 3
              ? "curve"
              : paramQuery.goal_id == 4
              ? "cluster"
              : "type"
          }"`
        : "type"
    } and concept_proposal_id = ${
      paramQuery.con_id ? paramQuery.con_id : "concept_proposal_id"
    }`
  );
  let concept_proposal_id = [];

  const sdg_data = await db.query(`SELECT * FROM bd_sdgs`);
  const sdg_arr = sdg_data.map((list, index) => ({
    [index + 1]: list.sdgs_name,
  }));
  const sdg_arr_img = sdg_data.map((list, index) => ({
    [index + 1]: list.sdgs_image,
  }));
  const sdg_obj = Object.assign({}, ...sdg_arr);
  const sdg_obj_img = Object.assign({}, ...sdg_arr_img);

  const bcg_data = await db.query(`SELECT * FROM bd_bcg`);
  const bcg_arr = bcg_data.map((list, index) => ({
    [index + 1]: list.bcg_name,
  }));
  const bcg_arr_img = bcg_data.map((list, index) => ({
    [index + 1]: list.bcg_image,
  }));
  const bcg_obj_img = Object.assign({}, ...bcg_arr_img);
  const bcg_obj = Object.assign({}, ...bcg_arr);

  const cluster_data = await db.query(`SELECT * FROM bd_cluster`);
  const cluster_arr = cluster_data.map((list, index) => ({
    [index + 1]: list.cluster_name,
  }));
  const cluster_arr_img = cluster_data.map((list, index) => ({
    [index + 1]: list.cluster_image,
  }));
  const cluster_obj_img = Object.assign({}, ...cluster_arr_img);
  const cluster_obj = Object.assign({}, ...cluster_arr);

  const curve_data = await db.query(`SELECT * FROM bd_10s_curve`);
  const curve_arr = curve_data.map((list, index) => ({
    [index + 1]: list.curve_name,
  }));
  const curve_arr_img = curve_data.map((list, index) => ({
    [index + 1]: list.curve_image,
  }));
  const curve_obj_img = Object.assign({}, ...curve_arr_img);
  const curve_obj = Object.assign({}, ...curve_arr);

  const newGoals = [];
  goals.map((listvalue) => {
    newGoals.push({
      ...listvalue,
      goal_name:
        listvalue.type == "sdg"
          ? sdg_obj[listvalue.item_id]
          : listvalue.type == "bcg"
          ? bcg_obj[listvalue.item_id]
          : listvalue.type == "curve"
          ? curve_obj[listvalue.item_id]
          : listvalue.type == "cluster"
          ? cluster_obj[listvalue.item_id]
          : listvalue.item_id,
      goal_image:
        listvalue.type == "sdg"
          ? sdg_obj_img[listvalue.item_id]
          : listvalue.type == "bcg"
          ? bcg_obj_img[listvalue.item_id]
          : listvalue.type == "curve"
          ? curve_obj_img[listvalue.item_id]
          : listvalue.type == "cluster"
          ? cluster_obj_img[listvalue.item_id]
          : listvalue.item_id,
    });

    concept_proposal_id.push(listvalue.concept_proposal_id);
  });
  let cciq = [...new Set(concept_proposal_id)];

  const concept_proposal_locations = [];
  for (let i = 0; i < cciq.length; i++) {
    const locations = await db.query(
      `SELECT * FROM concept_proposal
          INNER JOIN co_concept_fk ON concept_proposal.concept_proposal_id = co_concept_fk.concept_proposal_id
          INNER JOIN co_researcher ON co_researcher.co_researcher_id = co_concept_fk.co_researcher_id
          WHERE concept_proposal.concept_proposal_id = ${cciq[i]} AND co_concept_fk.area_status = 1

    `
    );
    const data = helper.emptyOrRows(locations);
    data.map((listvalue) =>
      concept_proposal_locations.push({
        concept_proposal_id: listvalue.concept_proposal_id,
        concept_proposal_name: listvalue.co_researcher_name_th,
        concept_proposal_name_th: listvalue.concept_proposal_name_th,
        project_type: listvalue.project_type_id,
        lat: listvalue.co_researcher_latitude,
        lon: listvalue.co_researcher_longitude,
      })
    );
  }

  // console.log(concept_proposal_locations);

  const newlocation = helper.groupBy(
    concept_proposal_locations,
    "concept_proposal_id"
  );
  const conceptlocation = newlocation.map((val) => val.data[0]);
  const conceptid = conceptlocation.map((val) => val.concept_proposal_id);

  const co_locations = [];
  for (let i = 0; i < conceptid.length; i++) {
    const co_concept = await db.query(`
      SELECT 
        cp.project_type_id,
        cp.concept_proposal_name_th,
        ccf.concept_proposal_id, 
        cr.co_researcher_name_th, 
        cr.co_researcher_latitude, 
        cr.co_researcher_longitude, 
        cr.co_researcher_image
      FROM co_concept_fk ccf 
        INNER JOIN co_researcher cr 
      ON cr.co_researcher_id = ccf.co_researcher_id
        INNER JOIN concept_proposal cp
      ON cp.concept_proposal_id = ccf.concept_proposal_id
        WHERE ccf.concept_proposal_id = ${conceptid[i]}`);

    co_concept.map((val) =>
      co_locations.push({
        concept_proposal_id: val.concept_proposal_id,
        concept_proposal_name: val.co_researcher_name_th,
        concept_proposal_name_th: val.concept_proposal_name_th,
        lat: val.co_researcher_latitude,
        lon: val.co_researcher_longitude,
        project_type: val.project_type_id,
      })
    );
  }

  conceptlocation.map((val) => co_locations.push(val));

  const results = co_locations.map((item) => {
    const arrayResult = newGoals.filter(
      (itemInArray) =>
        itemInArray.concept_proposal_id === item.concept_proposal_id
    );
    return { ...item, goals: arrayResult };
  });

  const groupCencept = helper.groupBy(results, "concept_proposal_id");
  groupCencept.map((v) => {
    if (v.data[0].goals.length >= 1) {
      const o = v.data.slice(1);
      // console.log(o);
      o.map((item) => {
        item.goals = [];
      });
    }
  });

  console.log(co_locations);

  const prepareNodes = [];
  groupCencept.map((listvalue, index) => {
    listvalue.data.map((item) => prepareNodes.push(item));
  });

  const parentNodes = [];
  prepareNodes.map((listvalue, index) => {
    parentNodes.push({
      id: index + 1,
      type: "parent",
      concept_proposal_id: listvalue.concept_proposal_id,
      concept_proposal_name: listvalue.concept_proposal_name,
      concept_proposal_name_th: listvalue.concept_proposal_name_th,

      lat: listvalue.lat,
      lon: listvalue.lon,
      goals: listvalue.goals,
      img: `https://researcher.kims-rmuti.com/icon/${
        listvalue.project_type == 1 ? "วิจัย.png" : "บริการ.png"
      }`,
    });
  });

  const childNodes = [];
  parentNodes.map((listvalue) =>
    listvalue.goals.map((item, index) =>
      childNodes.push({
        id: `${listvalue.id}.${index + 1}`,
        type: "child",
        concept_proposal_id: listvalue.concept_proposal_id,
        goal_name: item.goal_name,
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: "https://researcher.kims-rmuti.com/icon/" + item.goal_image,
      })
    )
  );

  const groupNodes = helper.groupBy(parentNodes, "concept_proposal_id");
  console.log("sss", groupNodes);

  let linkNode = [];
  const l = groupNodes.map((item) => {
    const linknode = item.data.map((link) => {
      return { from: link.id, to: link.id + 1 };
    });

    linknode.pop();

    // console.log("sssa", linknode[0]);
    if (linknode[0]) {
      let lastone = {
        from: linknode[0].from,
        to: linknode[linknode.length - 1].to,
      };
      linknode.push(lastone);
    }

    return { links: linknode };
  });

  l.map((item) => {
    // item.links.pop();
    item.links.map((list) => linkNode.push(list));
  });

  helper.applyArray(parentNodes, childNodes);

  const links = childNodes.map((listvalue) => {
    return {
      from: listvalue.id | 0,
      to: listvalue.id,
    };
  });

  helper.applyArray(links, linkNode);

  return {
    nodes: parentNodes,
    links: links,
  };
}

module.exports = {
  getNewGoals,
};

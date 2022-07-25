const db = require("./db");
const helper = require("../helper");

async function getGoalMap(paramsQuery) {
  const { university, impact, goal } = paramsQuery;
  console.log(paramsQuery);
  const rows = await db.query(`
      SELECT 
            cp.concept_proposal_id,
            cp.concept_proposal_name_th,
            cp.concept_proposal_name_en,
            cp.project_type_id,
            co.co_researcher_id,
            co.co_researcher_name_th,
            co.co_researcher_name_en,
            co.co_researcher_latitude,
            co.co_researcher_longitude,
            co.co_researcher_image, 
            u.user_section
      FROM concept_proposal AS cp 
      LEFT JOIN co_concept_fk AS cfk ON cp.concept_proposal_id = cfk.concept_proposal_id
      LEFT JOIN co_researcher AS co ON co.co_researcher_id = cfk.co_researcher_id
      LEFT JOIN bb_user AS u ON u.user_idcard = cp.user_idcard
      LEFT JOIN (
          SELECT 
              distinct bd_sum_goals.type,
              bd_sum_goals.concept_proposal_id
          FROM bd_sum_goals 
          ) AS goal ON goal.concept_proposal_id = cp.concept_proposal_id
      LEFT JOIN (
          select 
              distinct bd_outcome_issues.impact_id,  
              bd_sum_impact.concept_proposal_id
          from bd_sum_impact 
          left join bd_outcome_issues on bd_sum_impact.issues_id = bd_outcome_issues.issues_id
          ) AS impact ON impact.concept_proposal_id = cp.concept_proposal_id
      WHERE cfk.area_status = 1 AND u.user_section = ${
        university ? university : "u.user_section"
      } 
      AND ( goal.type = ${impact ? impact : "goal.type OR goal.type IS NULL"}) 
      AND ( impact.impact_id = ${
        goal ? goal : "impact.impact_id OR impact.impact_id IS NULL"
      })  
      GROUP BY cp.concept_proposal_id, co.co_researcher_id, u.user_section`);
  return rows;
}

async function getGoalGroup() {
  const rows = await db.query(
    `SELECT developmen_goal_id AS value, developmen_goal_name AS label FROM bd_development_goal`
  );
  return rows;
}
// เป้าหมายเพื่อการพัฒนา
async function getGoal(paramsQuery) {
  const rows = await db.query(`SELECT * 
    FROM bd_sum_goals AS sumgoals 
    INNER JOIN bd_cluster AS cluster ON sumgoals.item_id = cluster.cluster_id 
    WHERE sumgoals.concept_proposal_id = 42 
    AND sumgoals.type = 'cluster' 
    ORDER BY cluster.cluster_name ASC`);

  console.log(rows);
}
//`วิทยาเขตในหน้าของเป้าหมายเพื่อการพัฒนา
async function getCampusGroupgoal(paramsQuery) {
  const rows = await db.query(
    `SELECT  cp.concept_proposal_id, 
                  cp.concept_proposal_name_th, 
                  cp.concept_proposal_name_en,
                  cp.project_type_id,
                  un.name
          FROM bb_user bu 
              INNER JOIN university_name un on bu.user_section = un.unid 
              INNER JOIN concept_proposal cp on cp.user_idcard = bu.user_idcard
          WHERE un.unid = "${paramsQuery.groupId}"
      `
  );

  const data = helper.emptyOrRows(rows);

  const concept_proposal_id = data.map(
    (listvalue) => listvalue.concept_proposal_id
  );

  let cciq = [...new Set(concept_proposal_id)];
  console.log(cciq);

  const university = await db.query(
    `SELECT un.unid,
                un.name,
                un.lat,
                un.lot
        FROM university_name un WHERE un.unid = "${paramsQuery.groupId}"`
  );

  // console.log(data);

  const results_university = university.map((item) => {
    const arrayResult = data.filter(
      (itemInArray) => itemInArray.name === item.name
    );
    return { ...item, projects: arrayResult };
  });

  // console.log(results_university);
  //   console.log(results_university[0].projects)

  const parentNodes = [];

  results_university.map((listvalue, index) =>
    parentNodes.push({
      id: index + 1,
      type: "parent",
      university_name: listvalue.name,
      lat: listvalue.lat,
      lon: listvalue.lot,
      projects: listvalue.projects,
      img: "https://researcher.kims-rmuti.com/file-upload/researcher-upload/123.jpg",
    })
  );

  const childNodes = [];
  // const linksNodes = [];
  parentNodes.map((listvalue) => {
    listvalue.projects.map((item, index) => {
      childNodes.push({
        id: `${listvalue.id}.${index + 1}`,
        concept_proposal_id: item.concept_proposal_id,
        concept_proposal_name_th: item.concept_proposal_name_th,
        type: "child",
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: `https://researcher.kims-rmuti.com/icon/${
          item.project_type_id == 1
            ? "วิจัย.png"
            : item.project_type_id == 2
            ? "บริการ.png"
            : "u2t.jpg"
        }`,
      });
    });
  });

  // console.log(linksNodes);

  helper.applyArray(parentNodes, childNodes);

  parentNodes.map((v) => delete v.projects);

  const links = childNodes.map((listvalue) => {
    return {
      from: listvalue.id | 0,
      to: listvalue.id,
    };
  });

  // helper.applyArray(links, linksNodes);

  return {
    nodes: parentNodes,
    links: links,
  };
}

//หน้าแรกของเป้าหมายเพื่อการพัฒนา
async function getindexgoal() {}

module.exports = {
  getGoal,
  getindexgoal,
  getCampusGroupgoal,
  getGoalGroup,
  getGoalMap,
};

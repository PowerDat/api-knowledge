const db = require("./db");
const helper = require("../helper");

async function getGoalMap(group) {
  console.log(group);
  const projects = await db.query(`
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
                  prk.knowledge_group_id,
                  bd_sum_goals.concept_proposal_id
              FROM bd_sum_goals 
              LEFT JOIN progress_report_knowledge prk ON bd_sum_goals.progress_report_id = prk.progress_report_id 
              ) AS goal ON goal.concept_proposal_id = cp.concept_proposal_id
        LEFT JOIN (
              select 
                  distinct bd_outcome_issues.impact_id,  
                  bd_sum_impact.concept_proposal_id
              from bd_sum_impact 
              left join bd_outcome_issues on bd_sum_impact.issues_id = bd_outcome_issues.issues_id
              ) AS impact ON impact.concept_proposal_id = cp.concept_proposal_id
      WHERE cfk.area_status = 1 AND u.user_section = ${
        group.university ? group.university : "u.user_section"
      } 
      AND ( goal.type = ${
        group.goal ? group.goal : "goal.type OR goal.type IS NULL"
      }) 
      AND ( impact.impact_id = ${
        group.impact
          ? group.impact
          : "impact.impact_id OR impact.impact_id IS NULL"
      })  
      AND ( goal.knowledge_group_id =  ${
        group.knowledgegroup
          ? group.knowledgegroup
          : "goal.knowledge_group_id OR goal.knowledge_group_id IS NULL"
      })
      GROUP BY cp.concept_proposal_id, co.co_researcher_id, u.user_section`);
  const projectsData = helper.emptyOrRows(projects);
  const arrUniq = [
    ...new Map(
      projectsData
        .slice()
        .reverse()
        .map((v) => [v.concept_proposal_id, v])
    ).values(),
  ].reverse();

  if (arrUniq.length) {
    const conceptid = arrUniq.map((item) => item.concept_proposal_id);
    let bcgData = [],
      sdgData = [],
      curveData = [],
      clusterData = [];

    //bcg
    for (let i = 0; i < conceptid.length; i++) {
      const ID = conceptid[i];
      const bcg = await db.query(`
         SELECT 	  
            details.concept_proposal_id,
            details.concept_proposal_name_th,
            bcg.bcg_id,
            bcg.bcg_name,
            bcg.bcg_image,
            "bcg" as groupname,
            JSON_ARRAYAGG(JSON_OBJECT('detail', details.detail)) AS bcg_detail 
          FROM 
          ( 
            SELECT 
                sumgoal.bd_sum_goal_id,
                cp.concept_proposal_id,
                cp.concept_proposal_name_th,
                sumgoal.detail,
                sumgoal.item_id,
                sumgoal.type 
            FROM bd_sum_goals sumgoal     
              INNER JOIN concept_proposal cp ON cp.concept_proposal_id = sumgoal.concept_proposal_id
              WHERE sumgoal.type = ${
                group.goal ? group.goal : group.goal === "all" ? 1 : null
              }
              AND sumgoal.concept_proposal_id = ${ID} 
            GROUP BY sumgoal.bd_sum_goal_id, cp.concept_proposal_id ) AS details
          LEFT JOIN bd_bcg bcg ON bcg.bcg_id = details.item_id
          GROUP BY details.concept_proposal_id, bcg.bcg_id  
         `);
      bcg.map((item) => {
        console.log(item.bcg_detail);
        // try {
        //   item.bcg_detail = JSON.parse(item.bcg_detail);
        // } catch (error) {
        //   // SyntaxError: Unexpected end of JSON input
        //   console.log("error", error);
        // }

        bcgData.push(item);
      });
    }

    console.log(bcgData);
    //sdg
    for (let i = 0; i < conceptid.length; i++) {
      const ID = conceptid[i];
      const sdg = await db.query(`
         SELECT 	  
            details.concept_proposal_id,
            details.concept_proposal_name_th,
            sdg.sdgs_id,
            sdg.sdgs_name,
            sdg.sdgs_image,
            "sdg" as groupname,
            JSON_ARRAYAGG(JSON_OBJECT('detail', details.detail)) AS sdgs_detail 
          FROM 
          ( 
            SELECT 
                sumgoal.bd_sum_goal_id,
                cp.concept_proposal_id,
                cp.concept_proposal_name_th,
                sumgoal.detail,
                sumgoal.item_id,
                sumgoal.type 
            FROM bd_sum_goals sumgoal     
              INNER JOIN concept_proposal cp ON cp.concept_proposal_id = sumgoal.concept_proposal_id
              WHERE sumgoal.type = ${
                group.goal ? group.goal : group.goal === "all" ? 2 : null
              }
              AND sumgoal.concept_proposal_id = ${ID} 
            GROUP BY sumgoal.bd_sum_goal_id, cp.concept_proposal_id  ) AS details
          LEFT JOIN bd_sdgs sdg ON sdg.sdgs_id = details.item_id
          GROUP BY details.concept_proposal_id,
                    sdg.sdgs_id
         `);
      sdg.map((item) => {
        // item.sdgs_detail = JSON.parse(item.sdgs_detail);
        sdgData.push(item);
      });
    }

    console.log(sdgData);
    //10scurve
    for (let i = 0; i < conceptid.length; i++) {
      const ID = conceptid[i];
      const curve = await db.query(`
         SELECT 	  
            details.concept_proposal_id,
            details.concept_proposal_name_th,
            curve.curve_id,
            curve.curve_name,
            curve.curve_image,
            "curve" as groupname,
            JSON_ARRAYAGG(JSON_OBJECT('detail', details.detail)) AS curve_detail 
          FROM 
          ( 
            SELECT 
                sumgoal.bd_sum_goal_id,
                cp.concept_proposal_id,
                cp.concept_proposal_name_th,
                sumgoal.detail,
                sumgoal.item_id,
                sumgoal.type 
            FROM bd_sum_goals sumgoal    
              INNER JOIN concept_proposal cp ON cp.concept_proposal_id = sumgoal.concept_proposal_id 
              WHERE sumgoal.type = ${
                group.goal ? group.goal : group.goal === "all" ? 3 : null
              }
              AND sumgoal.concept_proposal_id = ${ID}
            GROUP BY sumgoal.bd_sum_goal_id, cp.concept_proposal_id  ) AS details
          LEFT JOIN bd_10s_curve curve ON curve.curve_id = details.item_id
          GROUP BY  details.concept_proposal_id,
                    curve.curve_id
         `);
      curve.map((item) => {
        // item.curve_detail = JSON.parse(item.curve_detail);
        curveData.push(item);
      });
    }

    console.log(curveData);

    //cluster
    for (let i = 0; i < conceptid.length; i++) {
      const ID = conceptid[i];
      const cluster = await db.query(`
         SELECT 	  
            details.concept_proposal_id,
            details.concept_proposal_name_th,
            cluster.cluster_id,
            cluster.cluster_name,
            cluster.cluster_image,
            "cluster" as groupname,
            JSON_ARRAYAGG(JSON_OBJECT('detail', details.detail)) AS cluster_detail 
          FROM 
          ( 
            SELECT 
                sumgoal.bd_sum_goal_id,
                cp.concept_proposal_id,
                cp.concept_proposal_name_th,
                sumgoal.detail,
                sumgoal.item_id,
                sumgoal.type 
            FROM bd_sum_goals sumgoal      
              INNER JOIN concept_proposal cp ON cp.concept_proposal_id = sumgoal.concept_proposal_id
              WHERE sumgoal.type = ${
                group.goal ? group.goal : group.goal === "all" ? 4 : null
              }
              AND sumgoal.concept_proposal_id = ${ID}
            GROUP BY sumgoal.bd_sum_goal_id, cp.concept_proposal_id ) AS details
          LEFT JOIN bd_cluster cluster ON cluster.cluster_id = details.item_id
          GROUP BY 
              details.concept_proposal_id,
              cluster.cluster_id
         `);
      cluster.map((item) => {
        // item.cluster_detail = JSON.parse(item.cluster_detail);
        clusterData.push(item);
      });
    }

    console.log(clusterData);

    const projectConceptBCG = helper.mergeArrWithSameKey(
      arrUniq,
      bcgData,
      "concept_proposal_id",
      "bcg"
    );

    const projectConceptSDGs = helper.mergeArrWithSameKey(
      projectConceptBCG,
      sdgData,
      "concept_proposal_id",
      "sdg"
    );

    const projectConcept10sCurve = helper.mergeArrWithSameKey(
      projectConceptSDGs,
      curveData,
      "concept_proposal_id",
      "curve"
    );

    const projectConceptCluster = helper.mergeArrWithSameKey(
      projectConcept10sCurve,
      clusterData,
      "concept_proposal_id",
      "cluster"
    );

    const filterGoal = projectConceptCluster.filter(
      (item) =>
        item.cluster.length > 0 ||
        item.curve.length > 0 ||
        item.bcg.length > 0 ||
        item.sdg.length > 0
    );

    let parentNodes = [],
      childNodesSdg = [],
      childNodesSdgSub = [],
      childNodesBcg = [],
      childNodesBcgSub = [],
      childNodesCurve = [],
      childNodesCurveSub = [],
      childNodesCluster = [],
      childNodesClusterSub = [],
      parentToBcgLink = [],
      bcgToBcgSub = [],
      parentToSdgLink = [],
      sdgToSdgSub = [],
      parentToCurveLink = [],
      curveToCurveSub = [],
      parentToClusterLink = [];
    (clusterToclusterSub = []),
      // knowledgeToInnovationLink = [],
      // innovationToNewKnowledgeLink = [];

      filterGoal.map((item, index) => {
        const ID = index + 1;
        const projecttype = Number(item.project_type_id);
        parentNodes.push({
          id: ID,
          type: "parent",
          label: helper.handleNameAndImage(projecttype, "label"),
          title: item.concept_proposal_name_th,
          lat: item.co_researcher_latitude,
          lon: item.co_researcher_longitude,
          img: helper.handleNameAndImage(projecttype, "image"),
        });

        if (item.bcg.length) {
          childNodesBcg.push({
            id: ID + ".b" + 1,
            type: "child",
            label: "BCG",
            title: "BCG",
            lat: item.co_researcher_latitude,
            lon: item.co_researcher_longitude,
            img: "https://researcher.kims-rmuti.com/icon/BCG.png",
          });

          parentToBcgLink.push({
            from: ID,
            to: ID + ".b" + 1,
          });

          item.bcg.map((bcgitem, bcgindex) => {
            const BID = bcgindex + 1;
            childNodesBcgSub.push({
              id: ID + "b." + BID,
              type: "child",
              label: bcgitem.bcg_name,
              title: `<div>
            ${bcgitem.bcg_detail.map(
              (ditem) => `<li>${ditem.detail}</li> `
            )}    
        </div>`,
              lat: item.co_researcher_latitude,
              lon: item.co_researcher_longitude,
              img:
                "https://researcher.kims-rmuti.com/icon/" + bcgitem.bcg_image,
            });

            bcgToBcgSub.push({
              from: ID + ".b" + 1,
              to: ID + "b." + BID,
            });
          });
        }

        if (item.sdg.length) {
          childNodesSdg.push({
            id: ID + ".s" + 1,
            type: "child",
            label: "SDGs",
            title: "Sustainable Development Goals",
            lat: item.co_researcher_latitude,
            lon: item.co_researcher_longitude,
            img: "https://researcher.kims-rmuti.com/icon/SDGs-icon.png",
          });

          parentToSdgLink.push({
            from: ID,
            to: ID + ".s" + 1,
          });

          item.sdg.map((sdgitem, sdgindex) => {
            const SID = sdgindex + 1;
            childNodesSdgSub.push({
              id: ID + "s." + SID,
              type: "child",
              label: sdgitem.sdgs_name,
              title: `<div>
            ${sdgitem.sdgs_detail.map(
              (ditem) => `<li>${ditem.detail}</li> `
            )}    
        </div>`,
              lat: item.co_researcher_latitude,
              lon: item.co_researcher_longitude,
              img:
                "https://researcher.kims-rmuti.com/icon/" + sdgitem.sdgs_image,
            });

            sdgToSdgSub.push({
              from: ID + ".s" + 1,
              to: ID + "s." + SID,
            });
          });
        }

        if (item.curve.length) {
          childNodesCurve.push({
            id: ID + ".cu" + 1,
            type: "child",
            label: "10 S-Curve",
            title: "10 S-Curve",
            lat: item.co_researcher_latitude,
            lon: item.co_researcher_longitude,
            img: "https://researcher.kims-rmuti.com/icon/10S-curve.png",
          });
          parentToCurveLink.push({
            from: ID,
            to: ID + ".cu" + 1,
          });

          item.curve.map((curveitem, curveindex) => {
            const CID = curveindex + 1;
            childNodesCurveSub.push({
              id: ID + "cu." + CID,
              type: "child",
              label: curveitem.curve_name,
              title: `<div>
              ${curveitem.curve_detail.map(
                (ditem) => `<li>${ditem.detail}</li> `
              )}    
          </div>`,
              lat: item.co_researcher_latitude,
              lon: item.co_researcher_longitude,
              img:
                "https://researcher.kims-rmuti.com/icon/" +
                curveitem.curve_image,
            });

            curveToCurveSub.push({
              from: ID + ".cu" + 1,
              to: ID + "cu." + CID,
            });
          });
        }

        if (item.cluster.length) {
          childNodesCluster.push({
            id: ID + ".cl" + 1,
            type: "child",
            label: "RMUTI Cluster",
            title: "RMUTI Cluster",
            lat: item.co_researcher_latitude,
            lon: item.co_researcher_longitude,
            img: "https://researcher.kims-rmuti.com/icon/RMUTI-Cluster.png",
          });
          parentToClusterLink.push({
            from: ID,
            to: ID + ".cl" + 1,
          });

          item.cluster.map((clusteritem, clusterindex) => {
            const CLID = clusterindex + 1;
            childNodesClusterSub.push({
              id: ID + "cl." + CLID,
              type: "child",
              label: clusteritem.cluster_name,
              title: `<div>
              ${clusteritem.cluster_detail.map(
                (ditem) => `<li>${ditem.detail}</li> `
              )}    
          </div>`,
              lat: item.co_researcher_latitude,
              lon: item.co_researcher_longitude,
              img:
                "https://researcher.kims-rmuti.com/icon/" +
                clusteritem.cluster_image,
            });

            clusterToclusterSub.push({
              from: ID + ".cl" + 1,
              to: ID + "cl." + CLID,
            });
          });
        }
      });

    const nodes = [
      ...parentNodes,
      ...childNodesBcg,
      ...childNodesBcgSub,
      ...childNodesSdg,
      ...childNodesSdgSub,
      ...childNodesCurve,
      ...childNodesCurveSub,
      ...childNodesCluster,
      ...childNodesClusterSub,
    ];

    const links = [
      ...parentToBcgLink,
      ...bcgToBcgSub,
      ...parentToSdgLink,
      ...sdgToSdgSub,
      ...parentToCurveLink,
      ...curveToCurveSub,
      ...parentToClusterLink,
      ...clusterToclusterSub,
    ];

    // const bcgResult = bcgData.filter((item) => {
    //   return group.groupId
    //     ? item.bcg_id === Number(group.groupId)
    //     : bcgData.some((f) => {
    //         return f.bcg_id === item.bcg_id;
    //       }) && item.groupname === group.groupName;
    // });

    // const sdgResult = sdgData.filter((item) => {
    //   return group.groupId
    //     ? item.sdgs_id === Number(group.groupId)
    //     : sdgData.some((f) => {
    //         return f.sdgs_id === item.sdgs_id;
    //       }) && item.groupname === group.groupName;
    // });

    // const curveResult = curveData.filter((item) => {
    //   return group.groupId
    //     ? item.curve_id === Number(group.groupId)
    //     : curveData.some((f) => {
    //         return f.curve_id === item.curve_id;
    //       }) && item.groupname === group.groupName;
    // });

    // const clusterResult = clusterData.filter((item) => {
    //   return group.groupId
    //     ? item.cluster_id === Number(group.groupId)
    //     : clusterData.some((f) => {
    //         return f.cluster_id === item.cluster_id;
    //       }) && item.groupname === group.groupName;
    // });

    const bcgRes = bcgData.filter(
      (item) => item.bcg_id === Number(group.groupId)
    );

    const sdgRes = sdgData.filter(
      (item) => item.sdgs_id === Number(group.groupId)
    );

    const curveRes = curveData.filter(
      (item) => item.curve_id === Number(group.groupId)
    );

    const clusterRes = clusterData.filter(
      (item) => item.cluster_id === Number(group.groupId)
    );

    return {
      // detail: filterGoal,
      nodes: nodes,
      links: links,
      data: {
        countBcg: bcgData.length,
        countSdg: sdgData.length,
        countCurve: curveData.length,
        countCluster: clusterData.length,
      },
      details: {
        bcg: bcgData,
        // group.groupname === "bcg" && group.groupId
        //   ? bcgRes
        //   : group.groupname === "bcg"
        //   ? bcgData
        //   : group.groupname === "all"
        //   ? bcgData
        //   : [],
        sdg: sdgData,
        // group.groupname === "sdg" && group.groupId
        //   ? sdgRes
        //   : group.groupname === "sdg"
        //   ? sdgData
        //   : group.groupname === "all"
        //   ? sdgData
        //   : [],
        curve: curveData,
        // group.groupname === "curve" && group.groupId
        //   ? curveRes
        //   : group.groupname === "curve"
        //   ? curveData
        //   : group.groupname === "all"
        //   ? curveData
        //   : [],
        cluster: clusterData,
        // group.groupname === "cluster" && group.groupId
        //   ? clusterRes
        //   : group.groupname === "cluster"
        //   ? clusterData
        //   : group.groupname === "all"
        //   ? clusterData
        //   : [],
      },
    };
  }
  return { messages: "not found." };
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

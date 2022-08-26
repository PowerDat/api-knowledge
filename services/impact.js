const db = require("./db");
const helper = require("../helper");

async function getImpactGroup() {
  const rows = await db.query(
    `SELECT impact_id AS value, impact_name AS label FROM bd_outcome_impact`
  );
  const data = helper.emptyOrRows(rows);
  return data;
}
//ผลกระทบหน้าแรกและ
async function getImpact(paramsQuery) {
  const rows = await db.query(`SELECT * FROM bd_sum_impact`);
  const data = helper.emptyOrRows(rows);
  const impacts = [];

  if (paramsQuery.impact_id == 0) {
    data.map((listvalue) => impacts.push(listvalue));
  } else {
    data.map((listvalue) => {
      JSON.parse(listvalue.impact_id).map((item) =>
        item == paramsQuery.impact_id ? impacts.push(listvalue) : []
      );
    });
  }

  //   console.log(impacts);

  const impact_arr = await db.query(`SELECT * FROM bd_outcome_impact`);
  const impact_data = helper.emptyOrRows(impact_arr);
  const impact_obj = impact_data.map((list, index) => {
    return {
      [index + 1]: list.impact_name,
    };
  });
  const obj = Object.assign({}, ...impact_obj);

  const progress_report_id = impacts.map((list) => list.progress_report_id);
  const concept_proposal_id = impacts.map((list) => list.concept_proposal_id);
  const impact_id = [];

  impacts.map((list) => {
    if (paramsQuery.impact_id == 0) {
      const impacts_all = JSON.parse(list.impact_id).map((item) => {
        return {
          concept_proposal_id: Number(list.concept_proposal_id),
          impacts: obj[item],
        };
      });
      impacts_all.map((v) => impact_id.push(v));
    } else {
      impact_id.push({
        concept_proposal_id: Number(list.concept_proposal_id),
        impacts: obj[paramsQuery.impact_id],
      });
    }
  });
  console.log(impact_id);

  //   let final_impact = [
  //     ...new Map(
  //       impact_id.map((v) => [v.concept_proposal_id && v.impacts, v])
  //     ).values(),
  //   ];

  let final_impact = impact_id.filter(
    (value, index, self) =>
      index ===
      self.findIndex(
        (t) =>
          t.concept_proposal_id === value.concept_proposal_id &&
          t.impacts === value.impacts
      )
  );

  console.log(final_impact);

  let priq = [...new Set(progress_report_id)];
  let cciq = [...new Set(concept_proposal_id)];

  let locations = [];
  // let concepts = [];
  // let innovations = [];
  for (let i = 0; i < cciq.length; i++) {
    const rows = await db.query(
      `SELECT * FROM concept_proposal
        INNER JOIN concept_proposal_locations ON concept_proposal.concept_proposal_id = concept_proposal_locations.concept_proposal_id
        WHERE concept_proposal.concept_proposal_id = ${cciq[i]}
      `
    );
    const data = helper.emptyOrRows(rows);
    data.map((item) => {
      locations.push({
        concept_proposal_id: item.concept_proposal_id,
        concept_proposal_name: item.concept_proposal_name,
        concept_proposal_name_th: item.concept_proposal_name_th,
        project_type: item.project_type_id,
        lat: item.concept_proposal_latitude,
        lon: item.concept_proposal_longitude,
      });
      // concepts.push({});
    });
  }

  const newlocation = helper.groupBy(locations, "concept_proposal_id");
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
  // console.log(co_locations);

  const results = await helper.compareArrayToAdd(
    co_locations,
    final_impact,
    "concept_proposal_id"
  );

  //   console.log(results.map((v) => v.impacts));

  const groupCencept = helper.groupBy(results, "concept_proposal_id");

  groupCencept.map((v) => {
    //   console.log(v.data);
    if (v.data[0].impacts.length >= 1) {
      const o = v.data.slice(1);
      // console.log(o);
      o.map((item) => {
        item.impacts = [];
      });
    }
  });

  const prepareNodes = [];
  groupCencept.map((listvalue, index) => {
    listvalue.data.map((item) => prepareNodes.push(item));
  });

  // console.log(results);
  // console.log(final_impact);
  const parentNodes = [];
  prepareNodes.map((listvalue, index) =>
    parentNodes.push({
      id: index + 1,
      type: "parent",
      concept_proposal_id: listvalue.concept_proposal_id,
      concept_proposal_name: listvalue.concept_proposal_name,
      concept_proposal_name_th: listvalue.concept_proposal_name_th,
      lat: listvalue.lat,
      lon: listvalue.lon,
      project_type: listvalue.project_type,
      // knowledges: listvalue.knowledges,
      // innovations: listvalue.innovations,
      impacts: listvalue.impacts,
      img: `https://researcher.kims-rmuti.com/icon/${
        listvalue.project_type == 1 ? "วิจัย.png" : "บริการ.png"
      }`,
    })
  );

  const childNodes = [];
  const childNodesConcepts = [];
  const childNodeImpacts = [];
  parentNodes.map((listvalue, i) => {
    listvalue.impacts.map((item, index) => {
      childNodeImpacts.push({
        id: `${listvalue.id}.${index + 1}`,
        type: "child",
        concept_proposal_id: listvalue.concept_proposal_id,
        impact_name: item.impacts,
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: `https://www.km-innovations.rmuti.ac.th/researcher/icon/${
          item.impacts == "เศรษฐกิจ"
            ? "Economy-impact.png"
            : item.impacts == "สังคม"
            ? "New-Social-impact.png"
            : item.impacts == "วัฒนธรรม"
            ? "Cultural-impact.png"
            : "Environmental-impact.png"
        }`,
      });
    });
  });

  // console.log(childNodesConcepts);

  let linkconcept = [];

  const groupNodes = helper.groupBy(parentNodes, "concept_proposal_id");
  // console.log("sss", groupNodes);

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
    item.links.map((list) => linkNode.push(list));
  });

  // console.log(linkNode);

  helper.applyArray(parentNodes, childNodes);
  // helper.applyArray(parentNodes, childNodesInnovations);
  helper.applyArray(parentNodes, childNodeImpacts);
  helper.applyArray(parentNodes, childNodesConcepts);

  const links = childNodeImpacts.map((listvalue) => {
    return {
      from: listvalue.id | 0,
      to: listvalue.id,
    };
  });

  // helper.applyArray(links, linksknow);
  // helper.applyArray(links, linkimpact);
  helper.applyArray(links, linkconcept);
  helper.applyArray(links, linkNode);

  return {
    nodes: parentNodes,
    links: links,
  };
}
//วิทยาเขตของหน้าผลกระทบส่วนดรอปดาว
async function getCampusGroupimpact(paramsQuery) {
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

  const real_impacts = [];

  for (let i = 0; i < cciq.length; i++) {
    const concept_id = cciq[i];

    const impactrow = await db.query(
      `SELECT * FROM bd_sum_impact where concept_proposal_id = ${concept_id}`
    );
    const data1 = helper.emptyOrRows(impactrow);
    const impacts = [];
    // if (paramsQuery.impact_id == 0) {
    data1.map((listvalue) => impacts.push(listvalue));
    // } else {
    // data1.map((listvalue) => {
    //   JSON.parse(listvalue.impact_id).map((item) =>
    //     item == paramsQuery.impact_id ? impacts.push(listvalue) : []
    //   );
    // });
    // }
    const impact_arr = await db.query(`SELECT * FROM bd_outcome_impact`);
    const impact_data = helper.emptyOrRows(impact_arr);
    const impact_obj = impact_data.map((list, index) => {
      return {
        [index + 1]: list.impact_name,
      };
    });
    const obj = Object.assign({}, ...impact_obj);

    // const progress_report_id = impacts.map((list) => list.progress_report_id);
    // const concept_proposal_id1 = impacts.map(
    //   (list) => list.concept_proposal_id
    // );
    const impact_id = [];
    impacts.map((list) => {
      //   if (paramsQuery.impact_id == 0) {
      const impacts_all = JSON.parse(list.impact_id).map((item) => {
        return {
          concept_proposal_id: Number(list.concept_proposal_id),
          impacts: obj[item],
        };
      });
      impacts_all.map((v) => impact_id.push(v));
      //   } else {
      //     impact_id.push({
      //       concept_proposal_id: Number(list.concept_proposal_id1),
      //       impacts: obj[paramsQuery.impact_id],
      //     });
      //   }
    });
    // console.log(impact_id);

    let final_impact = impact_id.filter(
      (value, index, self) =>
        index ===
        self.findIndex(
          (t) =>
            t.concept_proposal_id === value.concept_proposal_id &&
            t.impacts === value.impacts
        )
    );
    // console.log(final_impact);
    final_impact.map((value) => real_impacts.push(value));
  }

  const result_impacts = data.map((item) => {
    const arrayResult = real_impacts.filter(
      (itemInArray) =>
        itemInArray.concept_proposal_id === item.concept_proposal_id
    );
    return { ...item, impacts: arrayResult };
  });

  console.log(result_impacts);

  const results_university = university.map((item) => {
    // const arrayResult = data.filter(
    //   (itemInArray) => itemInArray.name === item.name
    // );
    return { ...item, projects: result_impacts };
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
  const linksNodes = [];
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
      item.impacts.map((d, i) => {
        linksNodes.push({
          from: `${listvalue.id}.${index + 1}`,
          to: `${index + 1}.${i + 1}im`,
        });
      });
    });
  });

  const childNodeImpacts = [];

  parentNodes[0].projects.map((listvalue, i) => {
    listvalue.impacts.map((item, index) => {
      childNodeImpacts.push({
        id: `${i + 1}.${index + 1}im`,
        type: "child",
        concept_proposal_id: listvalue.concept_proposal_id,
        impacts: item.impacts,
        lat: parentNodes[0].lat,
        lon: parentNodes[0].lon,
        img: `https://www.km-innovations.rmuti.ac.th/researcher/icon/${
          item.impacts == "เศรษฐกิจ"
            ? "Economy-impact.png"
            : item.impacts == "สังคม"
            ? "New-Social-impact.png"
            : item.impacts == "วัฒนธรรม"
            ? "Cultural-impact.png"
            : "Environmental-impact.png"
        }`,
      });
    });
  });

  // console.log(linksNodes);

  helper.applyArray(parentNodes, childNodes);
  helper.applyArray(parentNodes, childNodeImpacts);

  parentNodes.map((v) => delete v.projects);

  const links = childNodes.map((listvalue) => {
    return {
      from: listvalue.id | 0,
      to: listvalue.id,
    };
  });

  helper.applyArray(links, linksNodes);

  return {
    nodes: parentNodes,
    links: links,
  };
}

//งานวิจัยในหน้าผลกระทบ
async function getResearch(paramsQuery) {
  const rows = await db.query(
    `SELECT ccp.concept_proposal_id
      ,pr.progress_report_id
      ,ccp.concept_proposal_name_th
      FROM concept_proposal AS ccp
      INNER JOIN progress_report AS pr ON pr.concept_proposal_id = ccp.concept_proposal_id
      where ccp.concept_proposal_id="${paramsQuery.groupId}"
    `
  );

  const data = helper.emptyOrRows(rows);

  const concept_proposal_id = data.map(
    (listvalue) => listvalue.concept_proposal_id
  );

  let cciq = [...new Set(concept_proposal_id)];
  // console.log(cciq);

  const real_impacts = [];
  const concept_proposal_locations = [];

  for (let i = 0; i < cciq.length; i++) {
    const concept_id = cciq[i];

    const locations = await db.query(
      `SELECT * FROM concept_proposal
      INNER JOIN co_concept_fk ON concept_proposal.concept_proposal_id = co_concept_fk.concept_proposal_id
      INNER JOIN co_researcher ON co_researcher.co_researcher_id = co_concept_fk.co_researcher_id
      WHERE concept_proposal.concept_proposal_id = ${concept_id} AND co_concept_fk.area_status = 1
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

    // console.log(concept_proposal_locations);

    const impactrow = await db.query(
      `SELECT * FROM bd_sum_impact where concept_proposal_id = ${concept_id}`
    );
    const data1 = helper.emptyOrRows(impactrow);
    const impacts = [];
    data1.map((listvalue) => impacts.push(listvalue));

    const impact_arr = await db.query(`SELECT * FROM bd_outcome_impact`);
    const impact_data = helper.emptyOrRows(impact_arr);
    const impact_obj = impact_data.map((list, index) => {
      return {
        [index + 1]: list.impact_name,
      };
    });
    const obj = Object.assign({}, ...impact_obj);

    const impact_id = [];
    impacts.map((list) => {
      const impacts_all = JSON.parse(list.impact_id).map((item) => {
        return {
          concept_proposal_id: Number(list.concept_proposal_id),
          impacts: obj[item],
        };
      });
      impacts_all.map((v) => impact_id.push(v));
    });
    // console.log(impact_id);

    let final_impact = impact_id.filter(
      (value, index, self) =>
        index ===
        self.findIndex(
          (t) =>
            t.concept_proposal_id === value.concept_proposal_id &&
            t.impacts === value.impacts
        )
    );
    // console.log(final_impact);
    final_impact.map((value) => real_impacts.push(value));
  }

  // console.log(concept_proposal_locations);
  console.log(real_impacts);

  // start here
  const conceptlocation = concept_proposal_locations.map((val) => val);
  const conceptid = concept_proposal_locations[0].concept_proposal_id;

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
  console.log(co_locations);

  // end here

  const result_impacts = co_locations.map((item) => {
    const arrayResult = real_impacts.filter(
      (itemInArray) =>
        itemInArray.concept_proposal_id === item.concept_proposal_id
    );
    return { ...item, impacts: arrayResult };
  });

  console.log(result_impacts);

  const groupCencept = helper.groupBy(result_impacts, "concept_proposal_id");
  groupCencept.map((v) => {
    if (v.data[0].impacts.length >= 1) {
      const o = v.data.slice(1);
      // console.log(o);
      o.map((item) => {
        item.impacts = [];
      });
    }
  });

  // console.log(results_university);
  //   console.log(results_university[0].projects)

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
      impacts: listvalue.impacts,
      img: `https://researcher.kims-rmuti.com/icon/${
        listvalue.project_type == 1 ? "วิจัย.png" : "บริการ.png"
      }`,
    });
  });

  const childNodes = [];
  parentNodes.map((listvalue) =>
    listvalue.impacts.map((item, index) =>
      childNodes.push({
        id: `${listvalue.id}.${index + 1}`,
        type: "child",
        concept_proposal_id: listvalue.concept_proposal_id,
        impacts: item.impacts,
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: `https://www.km-innovations.rmuti.ac.th/researcher/icon/${
          item.impacts == "เศรษฐกิจ"
            ? "Economy-impact.png"
            : item.impacts == "สังคม"
            ? "New-Social-impact.png"
            : item.impacts == "วัฒนธรรม"
            ? "Cultural-impact.png"
            : "Environmental-impact.png"
        }`,
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

async function getimpactMap(group) {
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

  function removedub(array, field) {
    const arrUniq = [
      ...new Map(
        array
          .slice()
          .reverse()
          .map((v) => [v[`${field}`], v])
      ).values(),
    ].reverse();
    return arrUniq;
  }

  if (arrUniq.length) {
    const conceptid = arrUniq.map((item) => item.concept_proposal_id);
    let economyData = [],
      socialData = [],
      culturalData = [],
      environmentData = [];

    for (let i = 0; i < conceptid.length; i++) {
      const ID = conceptid[i];
      const economy = await db.query(`
      SELECT 
          issues_data.concept_proposal_id,
          issues_data.concept_proposal_name_th,
          bof.factor_id,
          bof.factor_name,
          bof.bd_outcome_image,
          JSON_ARRAYAGG(JSON_OBJECT('issue_detail', issues_data.issues_name , 'issue_id', issues_data.issues_id, 'impact_detail', issues_data.impact_detail)) AS issue_detail
      FROM (
          SELECT 
                  cp.concept_proposal_id,
                  cp.concept_proposal_name_th,
                  issues.factor_id,
                  imp.issues_id,
                  issues.issues_name,
                  JSON_ARRAYAGG(JSON_OBJECT('impact_detail', imp.impact_detail , 'impact_id', outimp.impact_id)) AS impact_detail
          FROM bd_sum_impact imp
              INNER JOIN bd_outcome_issues issues ON issues.issues_id = imp.issues_id
              INNER JOIN bd_outcome_impact outimp ON outimp.impact_id = issues.impact_id
              INNER JOIN concept_proposal cp ON cp.concept_proposal_id = imp.concept_proposal_id
               WHERE cp.concept_proposal_id = ${ID}
                AND outimp.impact_id = 1
          group by imp.issues_id, cp.concept_proposal_id, issues.factor_id
      ) AS issues_data 
      INNER JOIN bd_outcome_factor AS bof ON bof.factor_id = issues_data.factor_id
      GROUP BY bof.factor_id
            `);
      economy.map((item) => {
        // item.issue_detail = JSON.parse(item.issue_detail)
        item.issue_detail.map((iitem) => {
          // iitem.impact_detail = JSON.parse(iitem.impact_detail)
          const filterimpact = iitem.impact_detail.filter(
            (impdetail) => impdetail.impact_detail !== ""
          );
          iitem.impact_detail = removedub(filterimpact, "impact_detail");
        });
      });

      economy.map((item) => economyData.push(item));
    }

    // console.log(economyData);

    for (let i = 0; i < conceptid.length; i++) {
      const ID = conceptid[i];
      const social = await db.query(`
      SELECT 
          issues_data.concept_proposal_id,
          issues_data.concept_proposal_name_th,
          bof.factor_id,
          bof.factor_name,
          bof.bd_outcome_image,
          JSON_ARRAYAGG(JSON_OBJECT('issue_detail', issues_data.issues_name , 'issue_id', issues_data.issues_id, 'impact_detail', issues_data.impact_detail)) AS issue_detail
      FROM (
          SELECT 
                  cp.concept_proposal_id,
                  cp.concept_proposal_name_th,
                  issues.factor_id,
                  imp.issues_id,
                  issues.issues_name,
                  JSON_ARRAYAGG(JSON_OBJECT('impact_detail', imp.impact_detail , 'impact_id', outimp.impact_id)) AS impact_detail
          FROM bd_sum_impact imp
              INNER JOIN bd_outcome_issues issues ON issues.issues_id = imp.issues_id
              INNER JOIN bd_outcome_impact outimp ON outimp.impact_id = issues.impact_id
              INNER JOIN concept_proposal cp ON cp.concept_proposal_id = imp.concept_proposal_id
               WHERE cp.concept_proposal_id = ${ID}
                AND outimp.impact_id = 2
          group by imp.issues_id, cp.concept_proposal_id, issues.factor_id
      ) AS issues_data 
      INNER JOIN bd_outcome_factor AS bof ON bof.factor_id = issues_data.factor_id
      GROUP BY bof.factor_id
            `);
      social.map((item) => {
        // item.issue_detail = JSON.parse(item.issue_detail)
        item.issue_detail.map((iitem) => {
          // iitem.impact_detail = JSON.parse(iitem.impact_detail)
          const filterimpact = iitem.impact_detail.filter(
            (impdetail) => impdetail.impact_detail !== ""
          );
          iitem.impact_detail = removedub(filterimpact, "impact_detail");
        });
      });

      social.map((item) => socialData.push(item));
    }

    // console.log(socialData);

    for (let i = 0; i < conceptid.length; i++) {
      const ID = conceptid[i];
      const cultural = await db.query(`
      SELECT 
          issues_data.concept_proposal_id,
          issues_data.concept_proposal_name_th,
          bof.factor_id,
          bof.factor_name,
          bof.bd_outcome_image,
          JSON_ARRAYAGG(JSON_OBJECT('issue_detail', issues_data.issues_name , 'issue_id', issues_data.issues_id, 'impact_detail', issues_data.impact_detail)) AS issue_detail
      FROM (
          SELECT 
                  cp.concept_proposal_id,
                  cp.concept_proposal_name_th,
                  issues.factor_id,
                  imp.issues_id,
                  issues.issues_name,
                  JSON_ARRAYAGG(JSON_OBJECT('impact_detail', imp.impact_detail , 'impact_id', outimp.impact_id)) AS impact_detail
          FROM bd_sum_impact imp
              INNER JOIN bd_outcome_issues issues ON issues.issues_id = imp.issues_id
              INNER JOIN bd_outcome_impact outimp ON outimp.impact_id = issues.impact_id
              INNER JOIN concept_proposal cp ON cp.concept_proposal_id = imp.concept_proposal_id
               WHERE cp.concept_proposal_id = ${ID}
                AND outimp.impact_id = 3
          group by imp.issues_id, cp.concept_proposal_id, issues.factor_id
      ) AS issues_data 
      INNER JOIN bd_outcome_factor AS bof ON bof.factor_id = issues_data.factor_id
      GROUP BY bof.factor_id
            `);
      cultural.map((item) => {
        // item.issue_detail = JSON.parse(item.issue_detail)
        item.issue_detail.map((iitem) => {
          // iitem.impact_detail = JSON.parse(iitem.impact_detail)
          const filterimpact = iitem.impact_detail.filter(
            (impdetail) => impdetail.impact_detail !== ""
          );
          iitem.impact_detail = removedub(filterimpact, "impact_detail");
        });
      });

      cultural.map((item) => culturalData.push(item));
    }

    // console.log(culturalData);
    for (let i = 0; i < conceptid.length; i++) {
      const ID = conceptid[i];
      const environment = await db.query(`
      SELECT 
          issues_data.concept_proposal_id,
          issues_data.concept_proposal_name_th,
          bof.factor_id,
          bof.factor_name,
          bof.bd_outcome_image,
          JSON_ARRAYAGG(JSON_OBJECT('issue_detail', issues_data.issues_name , 'issue_id', issues_data.issues_id, 'impact_detail', issues_data.impact_detail)) AS issue_detail
      FROM (
          SELECT 
                  cp.concept_proposal_id,
                  cp.concept_proposal_name_th,
                  issues.factor_id,
                  imp.issues_id,
                  issues.issues_name,
                  JSON_ARRAYAGG(JSON_OBJECT('impact_detail', imp.impact_detail , 'impact_id', outimp.impact_id)) AS impact_detail
          FROM bd_sum_impact imp
              INNER JOIN bd_outcome_issues issues ON issues.issues_id = imp.issues_id
              INNER JOIN bd_outcome_impact outimp ON outimp.impact_id = issues.impact_id
              INNER JOIN concept_proposal cp ON cp.concept_proposal_id = imp.concept_proposal_id
               WHERE cp.concept_proposal_id = ${ID}
                AND outimp.impact_id = 4
          group by imp.issues_id, cp.concept_proposal_id, issues.factor_id
      ) AS issues_data 
      INNER JOIN bd_outcome_factor AS bof ON bof.factor_id = issues_data.factor_id
      GROUP BY bof.factor_id
            `);
      environment.map((item) => {
        // item.issue_detail = JSON.parse(item.issue_detail)
        item.issue_detail.map((iitem) => {
          // iitem.impact_detail = JSON.parse(iitem.impact_detail)
          const filterimpact = iitem.impact_detail.filter(
            (impdetail) => impdetail.impact_detail !== ""
          );
          iitem.impact_detail = removedub(filterimpact, "impact_detail");
        });
      });

      environment.map((item) => environmentData.push(item));
    }

    // console.log(environmentData);

    const projectConceptEconomy = helper.mergeArrWithSameKey(
      arrUniq,
      economyData,
      "concept_proposal_id",
      "Economy"
    );

    const projectConceptSocial = helper.mergeArrWithSameKey(
      projectConceptEconomy,
      socialData,
      "concept_proposal_id",
      "Social"
    );

    const projectConceptCultural = helper.mergeArrWithSameKey(
      projectConceptSocial,
      culturalData,
      "concept_proposal_id",
      "Cultural"
    );

    const projectConceptEnvironment = helper.mergeArrWithSameKey(
      projectConceptCultural,
      environmentData,
      "concept_proposal_id",
      "Environment"
    );

    const filterImpact = projectConceptEnvironment.filter(
      (item) =>
        item.Environment.length > 0 ||
        item.Cultural.length > 0 ||
        item.Social.length > 0 ||
        item.Economy.length > 0
    );

    console.log(filterImpact);

    let parentNodes = [],
      childNodesEconomy = [],
      childNodesEconomySub = [],
      childNodesSocial = [],
      childNodesSocialSub = [],
      childNodesCultural = [],
      childNodesCulturalSub = [],
      childNodesEnvironment = [],
      childNodesEnvironmentSub = [],
      parentToEconomyLink = [],
      economyToEconomySub = [],
      parentToSocialLink = [],
      socialToSocialSub = [],
      parentToCulturalLink = [],
      culturalToCulturalSub = [],
      parentToEnvironmentLink = [],
      environmentToEnvironmentSub = [];

    filterImpact.map((item, index) => {
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

      if (item.Economy.length) {
        childNodesEconomy.push({
          id: ID + ".e" + 1,
          type: "child",
          label: "เศรษฐกิจ",
          title: "Economy",
          lat: item.co_researcher_latitude,
          lon: item.co_researcher_longitude,
          img: "https://researcher.kims-rmuti.com/icon/Economy-impact.png",
        });

        parentToEconomyLink.push({
          from: ID,
          to: ID + ".e" + 1,
        });

        item.Economy.map((eitem, eindex) => {
          const EID = eindex + 1;
          childNodesEconomySub.push({
            id: ID + "e." + EID,
            type: "child",
            label: eitem.factor_name,
            title: `<div>
                    ${eitem.issue_detail.map(
                      (iitem) =>
                        `<strong>${iitem.issue_detail}</strong>   
                      <ul> 
                        ${iitem.impact_detail.map(
                          (ditem) => `<li>${ditem.impact_detail}</li>`
                        )}
                      </ul>`
                    )}    
                  </div>`,
            lat: item.co_researcher_latitude,
            lon: item.co_researcher_longitude,
            img:
              "https://researcher.kims-rmuti.com/icon/impact/" +
              eitem.bd_outcome_image,
          });

          economyToEconomySub.push({
            from: ID + ".e" + 1,
            to: ID + "e." + EID,
          });
        });
      }

      if (item.Social.length) {
        childNodesSocial.push({
          id: ID + ".s" + 1,
          type: "child",
          label: "สังคม",
          title: "Social",
          lat: item.co_researcher_latitude,
          lon: item.co_researcher_longitude,
          img: "https://researcher.kims-rmuti.com/icon/New-Social-impact.png",
        });

        parentToSocialLink.push({
          from: ID,
          to: ID + ".s" + 1,
        });

        item.Social.map((sitem, sindex) => {
          const SID = sindex + 1;
          childNodesSocialSub.push({
            id: ID + "s." + SID,
            type: "child",
            label: sitem.factor_name,
            title: `<div>
                      ${sitem.issue_detail.map(
                        (iitem) =>
                          `<strong>${iitem.issue_detail}</strong>   
                        <ul> 
                          ${iitem.impact_detail.map(
                            (ditem) => `<li>${ditem.impact_detail}</li>`
                          )}
                        </ul>`
                      )}    
                    </div>`,
            lat: item.co_researcher_latitude,
            lon: item.co_researcher_longitude,
            img:
              "https://researcher.kims-rmuti.com/icon/impact/" +
              sitem.bd_outcome_image,
          });

          socialToSocialSub.push({
            from: ID + ".s" + 1,
            to: ID + "s." + SID,
          });
        });
      }

      if (item.Cultural.length) {
        childNodesCultural.push({
          id: ID + ".t" + 1,
          type: "child",
          label: "วัฒนธรรม",
          title: "Cultural",
          lat: item.co_researcher_latitude,
          lon: item.co_researcher_longitude,
          img: "https://researcher.kims-rmuti.com/icon/Cultural-impact.png",
        });
        parentToCulturalLink.push({
          from: ID,
          to: ID + ".t" + 1,
        });

        item.Cultural.map((titem, tindex) => {
          const TID = tindex + 1;
          childNodesSocialSub.push({
            id: ID + "t." + TID,
            type: "child",
            label: titem.factor_name,
            title: `<div>
                    ${titem.issue_detail.map(
                      (iitem) =>
                        `<strong>${iitem.issue_detail}</strong>   
                      <ul> 
                        ${iitem.impact_detail.map(
                          (ditem) => `<li>${ditem.impact_detail}</li>`
                        )}
                      </ul>`
                    )}    
                  </div>`,
            lat: item.co_researcher_latitude,
            lon: item.co_researcher_longitude,
            img:
              "https://researcher.kims-rmuti.com/icon/impact/" +
              titem.bd_outcome_image,
          });

          culturalToCulturalSub.push({
            from: ID + ".t" + 1,
            to: ID + "t." + TID,
          });
        });
      }

      if (item.Environment.length) {
        childNodesEnvironment.push({
          id: ID + ".n" + 1,
          type: "child",
          label: "สิ่งแวดล้อม",
          title: "Environment",
          lat: item.co_researcher_latitude,
          lon: item.co_researcher_longitude,
          img: "https://researcher.kims-rmuti.com/icon/Environmental-impact.png",
        });
        parentToEnvironmentLink.push({
          from: ID,
          to: ID + ".n" + 1,
        });

        item.Environment.map((nitem, nindex) => {
          const NID = nindex + 1;
          childNodesSocialSub.push({
            id: ID + "n." + NID,
            type: "child",
            label: nitem.factor_name,
            title: `<div>${nitem.issue_detail.map(
              (iitem) => `<strong>${iitem.issue_detail}</strong>   
                      <ul> 
                        ${iitem.impact_detail.map(
                          (ditem) => `<li>${ditem.impact_detail}</li>`
                        )}
                      </ul>`
            )}    
                  </div>`,
            lat: item.co_researcher_latitude,
            lon: item.co_researcher_longitude,
            img:
              "https://researcher.kims-rmuti.com/icon/impact/" +
              nitem.bd_outcome_image,
          });

          environmentToEnvironmentSub.push({
            from: ID + ".n" + 1,
            to: ID + "n." + NID,
          });
        });
      }
    });

    const nodes = [
      ...parentNodes,
      ...childNodesEconomy,
      ...childNodesEconomySub,
      ...childNodesSocial,
      ...childNodesSocialSub,
      ...childNodesCultural,
      ...childNodesCulturalSub,
      ...childNodesEnvironment,
      ...childNodesEnvironmentSub,
    ];

    const links = [
      ...parentToEconomyLink,
      ...economyToEconomySub,
      ...parentToSocialLink,
      ...socialToSocialSub,
      ...parentToCulturalLink,
      ...culturalToCulturalSub,
      ...parentToEnvironmentLink,
      ...environmentToEnvironmentSub,
    ];

    // const economyResult = economyData.filter((item) => {
    //   return group.groupId
    //     ? item.bd_sum_impact_id === Number(group.groupId)
    //     : economyData.some((f) => {
    //         return f.bd_sum_impact_id === item.bd_sum_impact_id;
    //       }) && item.impact_id === Number(group.groupName);
    // });

    // const socialResult = socialData.filter((item) => {
    //   return group.groupId
    //     ? item.bd_sum_impact_id === Number(group.groupId)
    //     : socialData.some((f) => {
    //         return f.bd_sum_impact_id === item.bd_sum_impact_id;
    //       }) && item.impact_id === Number(group.groupName);
    // });

    // const culturalResult = culturalData.filter((item) => {
    //   return group.groupId
    //     ? item.bd_sum_impact_id === Number(group.groupId)
    //     : culturalData.some((f) => {
    //         return f.bd_sum_impact_id === item.bd_sum_impact_id;
    //       }) && item.impact_id === Number(group.groupName);
    // });

    // const environmentResult = environmentData.filter((item) => {
    //   return group.groupId
    //     ? item.bd_sum_impact_id === Number(group.groupId)
    //     : environmentData.some((f) => {
    //         return f.bd_sum_impact_id === item.bd_sum_impact_id;
    //       }) && item.impact_id === Number(group.groupName);
    // });

    const economyRes = economyData.filter(
      (item) => item.bd_sum_impact_id === Number(group.groupId)
    );

    const socialRes = socialData.filter(
      (item) => item.bd_sum_impact_id === Number(group.groupId)
    );

    const culturalRes = culturalData.filter(
      (item) => item.bd_sum_impact_id === Number(group.groupId)
    );

    const environmentRes = environmentData.filter(
      (item) => item.bd_sum_impact_id === Number(group.groupId)
    );

    console.log(economyRes);

    return {
      nodes: nodes,
      links: links,
      data: {
        countEconomy: economyData.length,
        countSocial: socialData.length,
        countCultural: culturalData.length,
        countEnvironment: environmentData.length,
      },
      details: {
        economy: economyData,
        // Number(group.groupname) === 1 && group.groupId
        //   ? economyRes
        //   : Number(group.groupname) === 1
        //   ? economyData
        //   : group.groupname === "all"
        //   ? economyData
        //   : [],
        social: socialData,
        // Number(group.groupname) === 2 && group.groupId
        //   ? socialRes
        //   : Number(group.groupname) === 2
        //   ? socialData
        //   : group.groupname === "all"
        //   ? socialData
        //   : [],
        cultural: culturalData,
        // Number(group.groupname) === 3 && group.groupId
        //   ? culturalRes
        //   : Number(group.groupname) === 3
        //   ? culturalData
        //   : group.groupname === "all"
        //   ? culturalData
        //   : [],
        environment: environmentData,
        // Number(group.groupname) === 4 && group.groupId
        //   ? environmentRes
        //   : Number(group.groupname) === 4
        //   ? environmentData
        //   : group.groupname === "all"
        //   ? environmentData
        //   : [],
      },
    };
  }

  return { messages: "not found." };
}

module.exports = {
  getImpact,
  getCampusGroupimpact,
  getResearch,
  getImpactGroup,
  getimpactMap,
};

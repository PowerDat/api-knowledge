const db = require("./db");
const helper = require("../helper");

//ผลกระทบ
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
        listvalue.project_type == 1 ? "งานวิจัย.png" : "บริการ.png"
      }`,
    })
  );

  const childNodes = [];
  const childNodesConcepts = [];
  const childNodesInnovations = [];
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
          paramsQuery.impact_id == 1
            ? "Economy-impact.png"
            : paramsQuery.impact_id == 2
            ? "New-Social-impact.png"
            : paramsQuery.impact_id == 3
            ? "Cultural-impact.png"
            : "Environmental-impact.png"
        }`,
      });
    });
  });

  // console.log(childNodesConcepts);

  let linksknow = [];
  let linkimpact = [];
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

//หน้าของผลกระทบ
async function getindeximpact(paramsQuery) {}

module.exports = {
  getImpact,
  getCampusGroupimpact,
  getindeximpact,
};

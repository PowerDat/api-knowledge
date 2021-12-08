const db = require("./db");
const helper = require("../helper");
const config = require("../config");

async function getOutput(paramsQuery) {
  const rows = await db.query(
    `SELECT * FROM progress_report_output 
          INNER JOIN progress_report 
            ON progress_report_output.progress_report_id = progress_report.progress_report_id
          INNER JOIN concept_proposal 
            ON concept_proposal.concept_proposal_id = progress_report.concept_proposal_id
          WHERE progress_report_output.output_name = '${paramsQuery.outputName}'
    `
  );
  const data = helper.emptyOrRows(rows);
  return data;
}

async function getNewKnowledgeByGrouup() {
  const rows = await db.query(
    `SELECT * FROM progress_report_knowledge AS PRK 
            INNER JOIN progress_report AS PR 
                ON PR.progress_report_id = PRK.progress_report_id
            INNER JOIN progress_report_knowledge_group AS PRKG
                ON PRKG.knowledge_group_id = PRK.knowledge_group_id
            WHERE PRKG.knowledge_group_category = "${paramsQuery.groupName}"
    `
  );
}

async function getOutput(paramsQuery) {
  const rows = await db.query(
    `SELECT * FROM progress_report_output pro 
      INNER JOIN progress_report pr 
      ON pr.progress_report_id = pro.progress_report_id
      WHERE pro.output_name = "${paramsQuery.groupName}"
    `
  );
  const data = helper.emptyOrRows(rows);
  let concept_proposal_id = [];
  data.map((listvalue) =>
    concept_proposal_id.push(listvalue.concept_proposal_id)
  );
  let cciq = [...new Set(concept_proposal_id)];

  let concept_proposal_locations = [];
  for (let i = 0; i < cciq.length; i++) {
    const locations = await db.query(
      `SELECT * FROM concept_proposal
              INNER JOIN concept_proposal_locations ON concept_proposal.concept_proposal_id = concept_proposal_locations.concept_proposal_id
          WHERE concept_proposal.concept_proposal_id = ${cciq[i]}
      `
    );
    const data = helper.emptyOrRows(locations);
    console.log(data);
    data.map((listvalue) =>
      concept_proposal_locations.push({
        concept_proposal_id: listvalue.concept_proposal_id,
        concept_proposal_name: listvalue.concept_proposal_name,
        lat: listvalue.concept_proposal_latitude,
        lon: listvalue.concept_proposal_longitude,
      })
    );
  }

  console.log(concept_proposal_locations);

  const results = concept_proposal_locations.map((item) => {
    const arrayResult = data.filter(
      (itemInArray) =>
        itemInArray.concept_proposal_id === item.concept_proposal_id
    );
    return { ...item, innovations: arrayResult };
  });
 
  const parentNodes = [];
  results.map((listvalue, index) =>
    parentNodes.push({
      id: index + 1,
      type: "parent",
      concept_proposal_name: listvalue.concept_proposal_name,
      lat: listvalue.lat,
      lon: listvalue.lon,
      innovations: listvalue.innovations,
      img: "https://logodix.com/logo/487697.png",
    })
  );

  const childNodes = [];
  parentNodes.map((listvalue) =>
    listvalue.innovations.map((item, index) =>
      childNodes.push({
        id: `${listvalue.id}.${index + 1}`,
        type: "child",
        output_name: item.output_name,
        output_detail: item.output_detail,
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: "https://www.km-innovations.rmuti.ac.th/researcher/icon/Innovation-icon.png",
      })
    )
  );

  helper.applyArray(parentNodes, childNodes);

  const links = childNodes.map((listvalue) => {
    return {
      from: listvalue.id | 0,
      to: listvalue.id,
    };
  });
  return {
    nodes: parentNodes,
    links: links,
  };
}

async function getKnowledgeByGrouup(paramsQuery) {
  const rows = await db.query(
    `SELECT * FROM progress_report_knowledge AS PRK 
            INNER JOIN progress_report AS PR 
                ON PR.progress_report_id = PRK.progress_report_id
            INNER JOIN progress_report_knowledge_group AS PRKG
                ON PRKG.knowledge_group_id = PRK.knowledge_group_id
            WHERE PRKG.knowledge_group_category = "${paramsQuery.groupName}"
    `
  );
  const data = helper.emptyOrRows(rows);
  let concept_proposal_id = [];
  data.map((listvalue) =>
    concept_proposal_id.push(listvalue.concept_proposal_id)
  );
  let cciq = [...new Set(concept_proposal_id)];
  let concept_proposal_locations = [];
  for (let i = 0; i < cciq.length; i++) {
    const locations = await db.query(
      `SELECT * FROM concept_proposal
              INNER JOIN concept_proposal_locations ON concept_proposal.concept_proposal_id = concept_proposal_locations.concept_proposal_id
          WHERE concept_proposal.concept_proposal_id = ${cciq[i]}
        `
    );
    const data = helper.emptyOrRows(locations);
    data.map((listvalue) =>
      concept_proposal_locations.push({
        concept_proposal_id: listvalue.concept_proposal_id,
        concept_proposal_name: listvalue.concept_proposal_name,
        lat: listvalue.concept_proposal_latitude,
        lon: listvalue.concept_proposal_longitude,
      })
    );
  }

  console.log(concept_proposal_locations);

  const results = concept_proposal_locations.map((item) => {
    const arrayResult = data.filter(
      (itemInArray) =>
        itemInArray.concept_proposal_id === item.concept_proposal_id
    );
    return { ...item, knowledges: arrayResult };
  });

  const groupCencept = helper.groupBy(results, "concept_proposal_id");
  const prepareNodes = [];
  groupCencept.map((listvalue, index) => {
    listvalue.data.map((item) => prepareNodes.push(item));
  });

  const parentNodes = [];
  prepareNodes.map((listvalue, index) =>
    parentNodes.push({
      id: index + 1,
      type: "parent",
      concept_proposal_name: listvalue.concept_proposal_name,
      lat: listvalue.lat,
      lon: listvalue.lon,
      knowledges: listvalue.knowledges,
      img: "https://logodix.com/logo/487697.png",
    })
  );

  const childNodes = [];
  parentNodes.map((listvalue) =>
    listvalue.knowledges.map((item, index) =>
      childNodes.push({
        id: `${listvalue.id}.${index + 1}`,
        type: "child",
        knowledge_name: item.knowledge_name,
        knowledge_detail: item.knowledge_detail,
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: "https://www.km-innovations.rmuti.ac.th/researcher/icon/Knowledge%20(3).png",
      })
    )
  );

  helper.applyArray(parentNodes, childNodes);

  const links = childNodes.map((listvalue) => {
    return {
      from: listvalue.id | 0,
      to: listvalue.id,
    };
  });
  return {
    nodes: parentNodes,
    links: links,
  };
}

async function getKnowledge() {
  const rows = await db.query(
    `SELECT progress_report_knowledge_group.knowledge_group_id, progress_report_knowledge_group.knowledge_group_category FROM progress_report_knowledge_group`
  );
  const data = helper.emptyOrRows(rows);
  return data;
}

async function getNewKnowledge() {
  const rows = await db.query(
    `SELECT pr.concept_proposal_id,
            pr.project_id,
            prok.outcome_knowledge_name, 
            prok.outcome_knowledge_detail,
            prok.outcome_knowledge_image,
            prok.outcome_knowledge_video
    FROM progress_report_outcome AS pro 
    INNER JOIN progress_report_outcome_knowledge AS prok
      ON pro.outcome_id = prok.outcome_id
    INNER JOIN progress_report AS pr 
      ON pr.progress_report_id = pro.progress_report_id
    `
  );
  const data = helper.emptyOrRows(rows);
  console.log(data);
  let concept_proposal_id = [];
  let project_id = [];
  data.map((listvalue) => {
    concept_proposal_id.push(listvalue.concept_proposal_id);
    project_id.push(listvalue.project_id);
  });
  let cciq = [...new Set(concept_proposal_id)];
  let pjid = [...new Set(project_id)];

  console.log(pjid.filter((x) => x !== null));

  let concept_proposal_locations = [];
  for (let i = 0; i < cciq.length; i++) {
    const locations = await db.query(
      `SELECT * FROM concept_proposal
              INNER JOIN concept_proposal_locations ON concept_proposal.concept_proposal_id = concept_proposal_locations.concept_proposal_id
          WHERE concept_proposal.concept_proposal_id = ${cciq[i]}
      `
    );
    const data = helper.emptyOrRows(locations);
    data.map((listvalue) =>
      concept_proposal_locations.push({
        concept_proposal_id: listvalue.concept_proposal_id,
        concept_proposal_name: listvalue.concept_proposal_name,
        lat: listvalue.concept_proposal_latitude,
        lon: listvalue.concept_proposal_longitude,
      })
    );
  }

  // let pjids = pjid.filter((x) => x !== null);
  // let project_locations = [];
  // for (let j = 0; j < pjids.length; j++) {
  //   const locations = await db.query(
  //     `SELECT * FROM us_project WHERE project_id = ${pjids[j]}`
  //   );
  //   const data = helper.emptyOrRows(locations);
  //   data.map((listvalue) =>
  //     project_locations.push({
  //       project_id: listvalue.project_id,
  //       project_name_th: listvalue.project_name_th,
  //       project_type: listvalue.project_type_id,
  //       lat: listvalue.project_latitude,
  //       lon: listvalue.project_longitude,
  //     })
  //   );
  // }
  // console.log(project_locations);

  // console.log(concept_proposal_locations);
  // const results1 = project_locations.map((item) => {
  //   const arrayResult = data.filter(
  //     (itemInArray) => itemInArray.project_id === item.project_id
  //   );
  //   return { ...item, new_knowledges: arrayResult };
  // });

  // console.log(results1);

  const results = concept_proposal_locations.map((item) => {
    const arrayResult = data.filter(
      (itemInArray) =>
        itemInArray.concept_proposal_id === item.concept_proposal_id
    );
    return { ...item, new_knowledges: arrayResult };
  });

  const groupCencept = helper.groupBy(results, "concept_proposal_id");
  const prepareNodes = [];
  groupCencept.map((listvalue, index) => {
    listvalue.data.map((item) => prepareNodes.push(item));
  });

  const project_nodes = [];
  // results1.map((listvalue, index) => {
  //   project_nodes.push({
  //     id: 1000 + 1,
  //     type: "parent",
  //     project_name: listvalue.project_name_th,
  //     lat: listvalue.lat,
  //     lon: listvalue.lon,
  //     new_knowledges: listvalue.new_knowledges,
  //     img: (listvalue.project_type_id = 1
  //       ? "https://www.km-innovations.rmuti.ac.th/researcher/icon/งานวิจัย.png"
  //       : "https://www.km-innovations.rmuti.ac.th/researcher/icon/บริการวิชาการ.png"),
  //   });
  // });

  // console.log(project_nodes);
  // const childNodesProject = [];
  // project_nodes.map((listvalue, index) => {
  //   listvalue.new_knowledges.map((item, index) =>
  //     childNodesProject.push({
  //       id: `${listvalue.id}.${index + 1}`,
  //       type: "child",
  //       knowledge_name: item.knowledge_name,
  //       knowledge_detail: item.knowledge_detail,
  //       lat: listvalue.lat,
  //       lon: listvalue.lon,
  //       img: "https://libapps-au.s3-ap-southeast-2.amazonaws.com/customers/7612/images/Know-512.png",
  //     })
  //   );
  // });
  // console.log(childNodesProject);

  const parentNodes = [];
  prepareNodes.map((listvalue, index) =>
    parentNodes.push({
      id: index + 1,
      type: "parent",
      concept_proposal_name: listvalue.concept_proposal_name,
      lat: listvalue.lat,
      lon: listvalue.lon,
      new_knowledges: listvalue.new_knowledges,
      img: "https://logodix.com/logo/487697.png",
    })
  );

  const childNodes = [];
  parentNodes.map((listvalue) =>
    listvalue.new_knowledges.map((item, index) =>
      childNodes.push({
        id: `${listvalue.id}.${index + 1}`,
        type: "child",
        outcome_knowledge_name: item.outcome_knowledge_name,
        outcome_knowledge_detail: item.outcome_knowledge_detail,
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: "https://www.km-innovations.rmuti.ac.th/researcher/icon/New-knowledge-icon.png",
      })
    )
  );

  helper.applyArray(parentNodes, childNodes);
  helper.applyArray(parentNodes, project_nodes);
  // helper.applyArray(parentNodes, childNodesProject);

  const links = childNodes.map((listvalue) => {
    return {
      from: listvalue.id | 0,
      to: listvalue.id,
    };
  });

  // const linksProject = childNodesProject.map((listvalue) => {
  //   return {
  //     from: listvalue.id | 0,
  //     to: listvalue.id,
  //   };
  // });

  // helper.applyArray(links, linksProject);

  return {
    nodes: parentNodes,
    links: links,
  };
}

module.exports = {
  getNewKnowledge,
  getKnowledge,
  getKnowledgeByGrouup,
  getOutput,
};

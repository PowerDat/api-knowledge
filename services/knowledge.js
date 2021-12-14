const db = require("./db");
const helper = require("../helper");

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

async function getImpact(paramsQuery) {
  const rows = await db.query(`SELECT * FROM bd_sum_impact`);
  const data = helper.emptyOrRows(rows);
  const impacts = [];
  data.map((listvalue) => {
    JSON.parse(listvalue.impact_id).map((item) =>
      item == paramsQuery.impact_id ? impacts.push(listvalue) : []
    );
  });

  const impact_arr = await db.query(`SELECT * FROM bd_outcome_impact`);
  const impact_data = helper.emptyOrRows(impact_arr);
  const impact_obj = impact_data.map((list, index) => {
    return { [index + 1]: list.impact_name };
  });
  const obj = Object.assign({}, ...impact_obj);

  const progress_report_id = impacts.map((list) => list.progress_report_id);
  const concept_proposal_id = impacts.map((list) => list.concept_proposal_id);
  const impact_id = impacts.map((list) => {
    // const impact_prepare = JSON.parse(list.impact_id).map((item) => {
    //   return {
    //     impact_name: obj[item],
    //   };
    // });
    return {
      concept_proposal_id: Number(list.concept_proposal_id),
      impacts: obj[paramsQuery.impact_id],
    };
  });
  let final_impact = [
    ...new Map(impact_id.map((v) => [v.concept_proposal_id, v])).values(),
  ];
  let priq = [...new Set(progress_report_id)];
  let cciq = [...new Set(concept_proposal_id)];

  // console.log(final_impact);

  let knowledges = [];
  for (let i = 0; i < priq.length; i++) {
    const rows = await db.query(
      `SELECT progress_report_knowledge.knowledge_id,
              progress_report_knowledge.knowledge_name,
              progress_report_knowledge.knowledge_detail,
              progress_report.concept_proposal_id,
              progress_report.progress_report_id 
        FROM progress_report_knowledge 
      INNER JOIN progress_report ON progress_report.progress_report_id = progress_report_knowledge.progress_report_id 
      WHERE progress_report_knowledge.progress_report_id = ${priq[i]} `
    );
    const data = helper.emptyOrRows(rows);
    data.map((item) => knowledges.push(item));
  }

  let locations = [];
  let innovations = [];
  for (let i = 0; i < cciq.length; i++) {
    const rows = await db.query(
      `SELECT * FROM concept_proposal
        INNER JOIN concept_proposal_locations ON concept_proposal.concept_proposal_id = concept_proposal_locations.concept_proposal_id
        WHERE concept_proposal.concept_proposal_id = ${cciq[i]}
      `
    );
    const data = helper.emptyOrRows(rows);
    data.map((item) =>
      locations.push({
        concept_proposal_id: item.concept_proposal_id,
        concept_proposal_name: item.concept_proposal_name,
        concept_proposal_name_th: item.concept_proposal_name_th,
        lat: item.concept_proposal_latitude,
        lon: item.concept_proposal_longitude,
      })
    );

    const rows_innovations = await db.query(
      `SELECT * FROM progress_report_output INNER JOIN progress_report 
          ON progress_report.progress_report_id = progress_report_output.progress_report_id 
        WHERE progress_report.concept_proposal_id = ${cciq[i]}`
    );

    const data1 = helper.emptyOrRows(rows_innovations);
    data1.map((listvalue) => {
      innovations.push({
        output_id: listvalue.output_id,
        concept_proposal_id: listvalue.concept_proposal_id,
        progress_report_id: listvalue.progress_report_id,
        output_name: listvalue.output_name,
        output_detail: listvalue.output_detail,
      });
    });
  }

  const results_locations = await helper.compareArrayToAdd(
    locations,
    knowledges,
    "concept_proposal_id"
  );

  const results_innovations = await helper.compareArrayToAdd(
    results_locations,
    innovations,
    "concept_proposal_id"
  );

  const results = await helper.compareArrayToAdd(
    results_innovations,
    final_impact,
    "concept_proposal_id"
  );

  // console.log(results);
  console.log(final_impact);
  const parentNodes = [];
  results.map((listvalue, index) =>
    parentNodes.push({
      id: index + 1,
      type: "parent",
      concept_proposal_name: listvalue.concept_proposal_name,
      concept_proposal_name_th: listvalue.concept_proposal_name_th,
      lat: listvalue.lat,
      lon: listvalue.lon,
      knowledges: listvalue.knowledges,
      innovations: listvalue.innovations,
      impacts: listvalue.impacts,
      img: "https://logodix.com/logo/487697.png",
    })
  );

  const childNodes = [];
  const childNodesInnovations = [];
  const childNodeImpacts = [];
  parentNodes.map((listvalue) => {
    listvalue.knowledges.map((item, index) => {
      childNodes.push({
        id: `${listvalue.id}.${index + 1}`,
        type: "child",
        knowledge_name: item.knowledge_name,
        knowledge_detail: item.knowledge_detail,
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: "https://www.km-innovations.rmuti.ac.th/researcher/icon/knowledge-icon.png",
      });
    });

    listvalue.innovations.map((item, index) => {
      childNodesInnovations.push({
        id: `${listvalue.id}.${index + 1}00`,
        type: "child",
        output_name: item.output_name,
        output_detail: item.output_detail,
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: "https://www.km-innovations.rmuti.ac.th/researcher/icon/Innovation-icon.png",
      });
    });

    listvalue.impacts.map((item, index) => {
      childNodeImpacts.push({
        id: `${listvalue.id}.${index + 1}000`,
        type: "child",
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

  let linksknow = [];
  let linkimpact = [];
  parentNodes.map((item) => {
    item.knowledges.map((list, i) => {
      item.innovations.map((listinno, j) => {
        linksknow.push({
          from: `${item.id}.${i + 1}`,
          to: `${item.id}.${j + 1}00`,
        });
      });
    });

    item.innovations.map((listitem, i) => {
      item.impacts.map((list, j) => {
        linkimpact.push({
          from: `${item.id}.${i + 1}00`,
          to: `${item.id}.${j + 1}000`,
        });
      });
    });
  });
  // console.log(linksknow);
  // console.log(linkimpact);

  helper.applyArray(parentNodes, childNodes);
  helper.applyArray(parentNodes, childNodesInnovations);
  helper.applyArray(parentNodes, childNodeImpacts);

  const links = childNodes.map((listvalue) => {
    return {
      from: listvalue.id | 0,
      to: listvalue.id,
    };
  });

  helper.applyArray(links, linksknow);
  helper.applyArray(links, linkimpact);

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

  data.map((listvalue) => {
    concept_proposal_id.push(listvalue.concept_proposal_id);
  });

  let cciq = [...new Set(concept_proposal_id)];

  console.log(cciq);

  let output_innovations = [];
  let concept_proposal_locations = [];
  for (let i = 0; i < cciq.length; i++) {
    const locations = await db.query(
      `SELECT * FROM concept_proposal
              INNER JOIN concept_proposal_locations ON concept_proposal.concept_proposal_id = concept_proposal_locations.concept_proposal_id
          WHERE concept_proposal.concept_proposal_id = ${cciq[i]}
        `
    );

    const data1 = helper.emptyOrRows(locations);
    data1.map((listvalue) =>
      concept_proposal_locations.push({
        concept_proposal_id: listvalue.concept_proposal_id,
        concept_proposal_name: listvalue.concept_proposal_name,
        lat: listvalue.concept_proposal_latitude,
        lon: listvalue.concept_proposal_longitude,
      })
    );

    const innovations = await db.query(
      `SELECT * FROM progress_report_output INNER JOIN progress_report 
          ON progress_report.progress_report_id = progress_report_output.progress_report_id 
        WHERE progress_report.concept_proposal_id = ${cciq[i]}`
    );

    const data = helper.emptyOrRows(innovations);
    data.map((listvalue) => {
      output_innovations.push({
        output_id: listvalue.output_id,
        concept_proposal_id: listvalue.concept_proposal_id,
        progress_report_id: listvalue.progress_report_id,
        output_name: listvalue.output_name,
        output_detail: listvalue.output_detail,
      });
    });
  }
  // console.log(output_innovations);

  // console.log(concept_proposal_locations);

  const results_locations = await helper.compareArrayToAdd(
    concept_proposal_locations,
    data,
    "concept_proposal_id"
  );

  const results = await helper.compareArrayToAdd(
    results_locations,
    output_innovations,
    "concept_proposal_id"
  );

  // console.log(results);

  const groupCencept = helper.groupBy(results, "concept_proposal_id");
  const prepareNodes = [];
  groupCencept.map((listvalue, index) => {
    listvalue.data.map((item) => prepareNodes.push(item));
  });
  console.log(prepareNodes);

  const parentNodes = [];
  prepareNodes.map((listvalue, index) =>
    parentNodes.push({
      id: index + 1,
      type: "parent",
      concept_proposal_name: listvalue.concept_proposal_name,
      lat: listvalue.lat,
      lon: listvalue.lon,
      knowledges: listvalue.knowledges,
      innovations: listvalue.innovations,
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
        img: "https://www.km-innovations.rmuti.ac.th/researcher/icon/knowledge-icon.png",
      })
    )
  );

  const childNodesInnovations = [];
  parentNodes.map((listvalue) =>
    listvalue.innovations.map((item, index) =>
      childNodesInnovations.push({
        id: `${listvalue.id}.${index + 1}00`,
        type: "child",
        output_name: item.output_name,
        output_detail: item.output_detail,
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: "https://www.km-innovations.rmuti.ac.th/researcher/icon/Innovation-icon.png",
      })
    )
  );

  // console.log(parentNodes);

  let linksknow = [];
  parentNodes.map((item) => {
    item.knowledges.map((list, i) => {
      item.innovations.map((listinno, j) => {
        linksknow.push({
          from: `${item.id}.${i + 1}`,
          to: `${item.id}.${j + 1}00`,
        });
      });
    });
  });
  console.log(linksknow);

  helper.applyArray(parentNodes, childNodes);
  helper.applyArray(parentNodes, childNodesInnovations);

  const links = childNodes.map((listvalue) => {
    return {
      from: listvalue.id | 0,
      to: listvalue.id,
    };
  });

  helper.applyArray(links, linksknow);
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

  const parentNodes = [];
  prepareNodes.map((listvalue, index) =>
    parentNodes.push({
      id: index + 1,
      type: "parent",
      concept_proposal_id: listvalue.concept_proposal_id,
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
        concept_proposal_id: listvalue.concept_proposal_id,
        outcome_knowledge_name: item.outcome_knowledge_name,
        outcome_knowledge_detail: item.outcome_knowledge_detail,
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: "https://www.km-innovations.rmuti.ac.th/researcher/icon/New-knowledge-icon.png",
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

module.exports = {
  getNewKnowledge,
  getKnowledge,
  getKnowledgeByGrouup,
  getOutput,
  getImpact,
};

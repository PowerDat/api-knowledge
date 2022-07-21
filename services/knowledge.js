const db = require("./db");
const helper = require("../helper");

// innovations
async function getOutput(paramsQuery) {
  console.log(paramsQuery);
  const rows = await db.query(
    `SELECT * FROM progress_report_output pro 
      INNER JOIN progress_report pr 
      ON pr.progress_report_id = pro.progress_report_id
      WHERE pro.output_name = "${decodeURIComponent(paramsQuery.groupName)}"
    `
  );
  const data = helper.emptyOrRows(rows);
  let concept_proposal_id = [];
  data.map((listvalue) =>
    concept_proposal_id.push(listvalue.concept_proposal_id)
  );
  let cciq = [...new Set(concept_proposal_id)];

  let concept_proposal_locations = [];
  let knowledges = [];
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
        concept_proposal_name_th: listvalue.concept_proposal_name_th,
        project_type: listvalue.project_type_id,
        lat: listvalue.concept_proposal_latitude,
        lon: listvalue.concept_proposal_longitude,
      })
    );

    const knowledges_list = await db.query(
      ` SELECT * FROM progress_report_knowledge 
            INNER JOIN progress_report ON progress_report.progress_report_id = progress_report_knowledge.progress_report_id
        WHERE progress_report.concept_proposal_id = ${cciq[i]}
      `
    );
    const data1 = helper.emptyOrRows(knowledges_list);
    data1.map((listvalue) =>
      knowledges.push({
        concept_proposal_id: listvalue.concept_proposal_id,
        knowledge_id: listvalue.knowledge_id,
        knowledge_name: listvalue.knowledge_name,
        knowledge_detail: listvalue.knowledge_detail,
      })
    );
  }

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
  console.log(co_locations);

  // console.log(knowledges);

  const results_locations = await helper.compareArrayToAdd(
    co_locations,
    data,
    "concept_proposal_id"
  );

  const results_knowledges = await helper.compareArrayToAdd(
    results_locations,
    knowledges,
    "concept_proposal_id"
  );

  console.log(results_knowledges);

  const groupCencept = helper.groupBy(
    results_knowledges,
    "concept_proposal_id"
  );

  groupCencept.map((v) => {
    if (v.data[0].knowledges.length >= 1 || v.data[0].innovations.length >= 1) {
      const o = v.data.slice(1);
      // console.log(o);
      o.map((item) => {
        item.knowledges = [];
        item.innovations = [];
      });
    }
  });

  const prepareNodes = [];
  groupCencept.map((listvalue, index) => {
    listvalue.data.map((item) => prepareNodes.push(item));
  });
  console.log(prepareNodes);

  // const results = concept_proposal_locations.map((item) => {
  //   const arrayResult = data.filter(
  //     (itemInArray) =>
  //       itemInArray.concept_proposal_id === item.concept_proposal_id
  //   );
  //   return { ...item, innovations: arrayResult };
  // });

  const parentNodes = [];
  prepareNodes.map((listvalue, index) =>
    parentNodes.push({
      id: index + 1,
      type: "parent",
      concept_proposal_name: listvalue.concept_proposal_name,
      project_type: listvalue.project_type,
      concept_proposal_name_th: listvalue.concept_proposal_name_th,
      lat: listvalue.lat,
      lon: listvalue.lon,
      innovations: listvalue.innovations,
      knowledges: listvalue.knowledges,
      img: `https://researcher.kims-rmuti.com/icon/${
        listvalue.project_type == 1 ? "วิจัย.png" : "บริการ.png"
      }`,
    })
  );

  const childNodes = [];
  const childNodeKnowledge = [];
  const childNodesConcepts = [];
  parentNodes.map((listvalue, i) => {
    // childNodesConcepts.push({
    //   id: `${listvalue.id}.${i + 1}`,
    //   type: "child",
    //   concept_proposal_id: listvalue.concept_proposal_id,
    //   concept_proposal_name_th: listvalue.concept_proposal_name_th,
    //   lat: listvalue.lat,
    //   lon: listvalue.lon,
    //   img: `https://www.km-innovations.rmuti.ac.th/researcher/icon/${
    //     listvalue.project_type == 1 ? "research.png" : "บริการวิชาการ.png"
    //   }`,
    // });
    listvalue.innovations.map((item, index) => {
      childNodes.push({
        id: `${listvalue.id}.${index + 1}`,
        type: "child",
        concept_proposal_id: item.concept_proposal_id,
        output_id: item.output_id,
        output_name: item.output_name,
        output_detail: item.output_detail,
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: "https://researcher.kims-rmuti.com/icon/innovation2.png",
      });
    });
    listvalue.knowledges.map((item, index) => {
      childNodeKnowledge.push({
        id: `${listvalue.id}.${index + 1}xn`,
        type: "child",
        concept_proposal_id: item.concept_proposal_id,
        knowledge_id: item.knowledge_id,
        knowledge_name: item.knowledge_name,
        knowledge_detail: item.knowledge_detail,
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: "https://researcher.kims-rmuti.com/icon/knowledge3(1).png",
      });
    });
  });

  console.log(childNodeKnowledge);

  let linksknow = [];
  let linkconcept = [];
  let linkinkn = [];
  parentNodes.map((item, i) => {
    // item.knowledges.map((list, j) => {
    //   linkconcept.push({
    //     from: `${item.id}.${i + 1}`,
    //     to: `${item.id}.${j + 1}xx`,
    //   });
    // });

    item.innovations.map((listinno, i) => {
      item.knowledges.map((list, j) => {
        linksknow.push({
          from: `${item.id}.${i + 1}`,
          to: `${item.id}.${j + 1}xn`,
        });
      });
    });

    item.knowledges.map((list, i) => {
      item.knowledges.map((list, j) => {
        linkinkn.push({
          from: `${item.id}.${i + 1}xn`,
          to: `${item.id}.${j + 1}xn`,
        });
      });
    });

    // item.knowledges.map((list, i) => {
    //   item.innovations.map((listinno, j) => {
    //     linksknow.push({
    //       from: `${item.id}.${i + 1}`,
    //       to: `${item.id}.${j + 1}xn`,
    //     });
    //   });
    // });
  });

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

  console.log(linkNode);

  helper.applyArray(parentNodes, childNodes);
  helper.applyArray(parentNodes, childNodeKnowledge);
  helper.applyArray(parentNodes, childNodesConcepts);

  const links = childNodes.map((listvalue) => {
    return {
      from: listvalue.id | 0,
      to: listvalue.id,
    };
  });

  helper.applyArray(links, linksknow);
  helper.applyArray(links, linkconcept);
  helper.applyArray(links, linkinkn);
  helper.applyArray(links, linkNode);

  return {
    nodes: parentNodes,
    links: links,
  };
}
// เป้าหมายเพื่อการพัฒนา
async function getGoal(paramsQuery) {
  const rows = await db.query(`SELECT * FROM bd_sum_goal`);
  const data = helper.emptyOrRows(rows);

  const goals = [];
  data.map((listvalue) => {
    paramsQuery.goal_id == 1
      ? listvalue.bcg_id
        ? goals.push(listvalue)
        : []
      : paramsQuery.goal_id == 2
      ? listvalue.sdgs_id
        ? goals.push(listvalue)
        : []
      : paramsQuery.goal_id == 3
      ? listvalue.curve_id
        ? goals.push(listvalue)
        : []
      : paramsQuery.goal_id == 4
      ? listvalue.cluster_id
        ? goals.push(listvalue)
        : []
      : [];
  });

  function getUniqueListBy(arr, key) {
    return [...new Map(arr.map((item) => [item[key], item])).values()];
  }

  const newListGoal = getUniqueListBy(goals, "concept_proposal_id");

  const bcg_array = [];
  if (paramsQuery.goal_id == 1) {
    const bcg = newListGoal.map((list) => {
      return {
        bcg_id: list.bcg_id,
        concept_proposal_id: list.concept_proposal_id,
      };
    });
    for (let i = 0; i < bcg.length; i++) {
      for (let j = 0; j < JSON.parse(bcg[i].bcg_id).length; j++) {
        const rows = await db.query(
          `SELECT * FROM bd_bcg where bcg_id = ${JSON.parse(bcg[i].bcg_id)[j]}`
        );
        const data = helper.emptyOrRows(rows);
        data.map((item) =>
          bcg_array.push({
            concept_proposal_id: Number(bcg[i].concept_proposal_id),
            bcg_name: item.bcg_name,
            img: item.bcg_image,
          })
        );
      }
    }
  }
  // console.log(bcg_array);

  const sdgs_array = [];
  if (paramsQuery.goal_id == 2) {
    const sdgs = newListGoal.map((list) => {
      return {
        sdgs_id: list.sdgs_id,
        concept_proposal_id: list.concept_proposal_id,
      };
    });
    for (let i = 0; i < sdgs.length; i++) {
      for (let j = 0; j < JSON.parse(sdgs[i].sdgs_id).length; j++) {
        const rows = await db.query(
          `SELECT * FROM bd_sdgs where sdgs_id = ${
            JSON.parse(sdgs[i].sdgs_id)[j]
          }`
        );
        const data = helper.emptyOrRows(rows);
        data.map((item) =>
          sdgs_array.push({
            concept_proposal_id: Number(sdgs[i].concept_proposal_id),
            sdgs_name: item.sdgs_name,
            img: item.sdgs_image,
          })
        );
      }
    }
  }
  // console.log(sdgs_array);

  const curve_array = [];
  if (paramsQuery.goal_id == 3) {
    const curve = newListGoal.map((list) => {
      return {
        curve_id: list.curve_id,
        concept_proposal_id: list.concept_proposal_id,
      };
    });
    for (let i = 0; i < curve.length; i++) {
      for (let j = 0; j < JSON.parse(curve[i].curve_id).length; j++) {
        const rows = await db.query(
          `SELECT * FROM bd_10s_curve where curve_id = ${
            JSON.parse(curve[i].curve_id)[j]
          }`
        );
        const data = helper.emptyOrRows(rows);
        data.map((item) =>
          curve_array.push({
            concept_proposal_id: Number(curve[i].concept_proposal_id),
            curve_name: item.curve_name,
            img: item.curve_image,
          })
        );
      }
    }
  }
  // console.log(curve_array);

  const cluster_array = [];
  if (paramsQuery.goal_id == 4) {
    const cluster = newListGoal.map((list) => {
      return {
        cluster_id: list.cluster_id,
        concept_proposal_id: list.concept_proposal_id,
      };
    });
    for (let i = 0; i < cluster.length; i++) {
      for (let j = 0; j < JSON.parse(cluster[i].cluster_id).length; j++) {
        const rows = await db.query(
          `SELECT * FROM bd_cluster where cluster_id = ${
            JSON.parse(cluster[i].cluster_id)[j]
          }`
        );
        const data = helper.emptyOrRows(rows);
        data.map((item) =>
          cluster_array.push({
            concept_proposal_id: Number(cluster[i].concept_proposal_id),
            cluster_name: item.cluster_name,
            img: item.cluster_image,
          })
        );
      }
    }
  }
  // console.log(cluster_array);

  const progress_report_id = newListGoal.map((list) => list.progress_report_id);
  const concept_proposal_id = newListGoal.map(
    (list) => list.concept_proposal_id
  );
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

    // start here
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
    console.log(co_locations);

    // end here
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
  console.log(co_locations);

  const goalPoint = async () => {
    if (paramsQuery.goal_id == 1) {
      return await helper.compareArrayToAdd(
        co_locations,
        bcg_array,
        "concept_proposal_id"
      );
    }
    if (paramsQuery.goal_id == 2) {
      return await helper.compareArrayToAdd(
        co_locations,
        sdgs_array,
        "concept_proposal_id"
      );
    }
    if (paramsQuery.goal_id == 3) {
      return await helper.compareArrayToAdd(
        co_locations,
        curve_array,
        "concept_proposal_id"
      );
    }
    if (paramsQuery.goal_id == 4) {
      return await helper.compareArrayToAdd(
        co_locations,
        cluster_array,
        "concept_proposal_id"
      );
    }
  };

  const results = await goalPoint();

  const groupCencept = helper.groupBy(results, "concept_proposal_id");

  groupCencept.map((v) => {
    if (v.data[0].bcg) {
      if (v.data[0].bcg.length >= 1) {
        const o = v.data.slice(1);
        console.log(o);
        o.map((item) => {
          item.bcg = [];
        });
      }
    }

    if (v.data[0].sdgs) {
      if (v.data[0].sdgs.length >= 1) {
        const o = v.data.slice(1);
        console.log(o);
        o.map((item) => {
          item.sdgs = [];
        });
      }
    }

    if (v.data[0].curve) {
      if (v.data[0].curve.length >= 1) {
        const o = v.data.slice(1);
        console.log(o);
        o.map((item) => {
          item.curve = [];
        });
      }
    }

    if (v.data[0].cluster) {
      if (v.data[0].cluster.length >= 1) {
        const o = v.data.slice(1);
        console.log(o);
        o.map((item) => {
          item.cluster = [];
        });
      }
    }
  });

  // console.log(groupCencept);

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
      concept_proposal_name_th: listvalue.concept_proposal_name_th,
      lat: listvalue.lat,
      lon: listvalue.lon,
      project_type: listvalue.project_type,
      // knowledges: listvalue.knowledges,
      // innovations: listvalue.innovations,
      [paramsQuery.goal_id == 1
        ? "bcg"
        : paramsQuery.goal_id == 2
        ? "sdgs"
        : paramsQuery.goal_id == 3
        ? "curve"
        : paramsQuery.goal_id == 4
        ? "cluster"
        : ""]:
        paramsQuery.goal_id == 1
          ? listvalue.bcg
          : paramsQuery.goal_id == 2
          ? listvalue.sdgs
          : paramsQuery.goal_id == 3
          ? listvalue.curve
          : paramsQuery.goal_id == 4
          ? listvalue.cluster
          : "",
      img: `https://researcher.kims-rmuti.com/icon/${
        listvalue.project_type == 1 ? "วิจัย.png" : "บริการ.png"
      }`,
    })
  );

  // const childNodes = [];
  const childNodesConcepts = [];
  // const childNodesInnovations = [];
  const childNodeGoal = [];
  parentNodes.map((listvalue, i) => {
    // childNodesConcepts.push({
    //   id: `${listvalue.id}.${i + 1}`,
    //   type: "child",
    //   concept_proposal_id: listvalue.concept_proposal_id,
    //   concept_proposal_name_th: listvalue.concept_proposal_name_th,
    //   lat: listvalue.lat,
    //   lon: listvalue.lon,
    //   img: `https://researcher.kims-rmuti.com/icon/${
    //     listvalue.project_type == 1 ? "research.png" : "บริการวิชาการ.png"
    //   }`,
    // });

    // listvalue.knowledges.map((item, index) => {
    //   childNodes.push({
    //     id: `${listvalue.id}.${index + 1}xn`,
    //     type: "child",
    //     knowledge_name: item.knowledge_name,
    //     knowledge_detail: item.knowledge_detail,
    //     lat: listvalue.lat,
    //     lon: listvalue.lon,
    //     img: "https://www.km-innovations.rmuti.ac.th/researcher/icon/knowledge-icon.png",
    //   });
    // });

    // listvalue.innovations.map((item, index) => {
    //   childNodesInnovations.push({
    //     id: `${listvalue.id}.${index + 1}xx`,
    //     type: "child",
    //     output_name: item.output_name,
    //     output_detail: item.output_detail,
    //     lat: listvalue.lat,
    //     lon: listvalue.lon,
    //     img: "https://www.km-innovations.rmuti.ac.th/researcher/icon/Innovation-icon.png",
    //   });
    // });

    listvalue[
      `${
        paramsQuery.goal_id == 1
          ? "bcg"
          : paramsQuery.goal_id == 2
          ? "sdgs"
          : paramsQuery.goal_id == 3
          ? "curve"
          : paramsQuery.goal_id == 4
          ? "cluster"
          : ""
      }`
    ].map((item, index) => {
      childNodeGoal.push({
        id: `${listvalue.id}.${index + 1}`,
        concept_proposal_id: listvalue.concept_proposal_id,
        type: "child",
        [paramsQuery.goal_id == 1
          ? "bcg"
          : paramsQuery.goal_id == 2
          ? "sdgs"
          : paramsQuery.goal_id == 3
          ? "curve"
          : paramsQuery.goal_id == 4
          ? "cluster"
          : ""]:
          paramsQuery.goal_id == 1
            ? item.bcg_name
            : paramsQuery.goal_id == 2
            ? item.sdgs_name
            : paramsQuery.goal_id == 3
            ? item.curve_name
            : paramsQuery.goal_id == 4
            ? item.cluster_name
            : "",
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: `https://researcher.kims-rmuti.com/icon/${item.img}`,
      });
    });
  });

  console.log(childNodeGoal);

  // let linksknow = [];
  // let linkgoal = [];
  let linkconcept = [];

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

  console.log(linkNode);

  helper.applyArray(parentNodes, childNodeGoal);
  helper.applyArray(parentNodes, childNodesConcepts);

  const links = childNodeGoal.map((listvalue) => {
    return {
      from: listvalue.id | 0,
      to: listvalue.id,
    };
  });

  helper.applyArray(links, linkconcept);
  helper.applyArray(links, linkNode);

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
    return {
      [index + 1]: list.impact_name,
    };
  });
  const obj = Object.assign({}, ...impact_obj);

  const progress_report_id = impacts.map((list) => list.progress_report_id);
  const concept_proposal_id = impacts.map((list) => list.concept_proposal_id);
  const impact_id = impacts.map((list) => {
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
  console.log(co_locations);

  const results = await helper.compareArrayToAdd(
    co_locations,
    final_impact,
    "concept_proposal_id"
  );

  const groupCencept = helper.groupBy(results, "concept_proposal_id");

  groupCencept.map((v) => {
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

  console.log(childNodesConcepts);

  let linksknow = [];
  let linkimpact = [];
  let linkconcept = [];

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
    item.links.map((list) => linkNode.push(list));
  });

  console.log(linkNode);

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

async function getCampusGroup(paramsQuery) {
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
    `SELECT * FROM university_name un WHERE un.unid = "${paramsQuery.groupId}"`
  );

  // console.log(data);

  // const results_university = university.map((item) => {
  //     const arrayResult = data.filter(
  //         (itemInArray) => itemInArray.name === item.name
  //     );
  //     return {...item, projects: arrayResult };
  // });

  // console.log(results_university);

  let knowledgedata = [],
    Innovationdata = [],
    newKnowledgeData = [];

  for (let i = 0; i < cciq.length; i++) {
    const knowledges = await db.query(
      `SELECT progress_report.progress_report_id,
              progress_report.concept_proposal_id,
              progress_report_knowledge.knowledge_id,
              progress_report_knowledge.knowledge_name,
              progress_report_knowledge.knowledge_detail,
              progress_report_knowledge_group.knowledge_group_category
      FROM progress_report_knowledge
        JOIN progress_report_knowledge_group ON progress_report_knowledge_group.knowledge_group_id = progress_report_knowledge.knowledge_group_id
        JOIN progress_report ON progress_report.progress_report_id = progress_report_knowledge.progress_report_id
      WHERE progress_report.concept_proposal_id = ${cciq[i]}
      `
    );
    knowledges.map((listvalue) => knowledgedata.push(listvalue));

    // จบตรงนี้1 อาเรย์
    // เตรียมข้อมูลออกมาเพื่อทำโหนด
    const Innovation = await db.query(
      `SELECT progress_report.concept_proposal_id,
              progress_report.progress_report_id,
              progress_report_output.output_id,
              progress_report_output.output_name,
              progress_report_output.output_detail
      FROM progress_report_output
      JOIN progress_report ON progress_report.progress_report_id = progress_report_output.progress_report_id
      
        WHERE progress_report.concept_proposal_id = ${cciq[i]}
        `
    );
    Innovation.map((listvalue) => Innovationdata.push(listvalue));

    const newKnowledge = await db.query(`
                SELECT pr.concept_proposal_id,
                    pr.project_id,
                    prok.outcome_knowledge_name, 
                    prok.outcome_knowledge_id,
                    prok.outcome_knowledge_detail,
                    prok.outcome_knowledge_image,
                    prok.outcome_knowledge_video
            FROM progress_report_outcome AS pro 
                INNER JOIN progress_report_outcome_knowledge AS prok
            ON pro.outcome_id = prok.outcome_id
                INNER JOIN progress_report AS pr 
            ON pr.progress_report_id = pro.progress_report_id
            
            WHERE pr.concept_proposal_id = ${cciq[i]}
            and prok.outcome_knowledge_name is not null
        `);
    newKnowledge.map((listvalue) => newKnowledgeData.push(listvalue));
  }

  // console.log(newKnowledgeData);

  const results_knowledges = data.map((item) => {
    const arrayResult = knowledgedata.filter(
      (itemInArray) =>
        itemInArray.concept_proposal_id === item.concept_proposal_id
    );
    return { ...item, knowledges: arrayResult };
  });

  // console.log(resultsknowledge);

  const resultsinnovation = results_knowledges.map((item) => {
    const arrayResult = Innovationdata.filter(
      (itemInArray) =>
        itemInArray.concept_proposal_id === item.concept_proposal_id
    );
    return { ...item, innovations: arrayResult };
  });

  // console.log(resultsinnovation);

  const resultsnewknowledge = resultsinnovation.map((item) => {
    const arrayResult = newKnowledgeData.filter(
      (itemInArray) =>
        itemInArray.concept_proposal_id === item.concept_proposal_id
    );
    return { ...item, newknowledges: arrayResult };
  });

  // console.log(resultsnewknowledge);

  // const prepareNodes = [];
  // groupCencept.map((listvalue, index) => {
  //     listvalue.data.map((item) => prepareNodes.push(item));
  // });

  const results_university = university.map((item) => {
    return {
      ...item,
      projects: resultsnewknowledge,
    };
  });

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
      item.knowledges.map((d, i) => {
        linksNodes.push({
          from: `${listvalue.id}.${index + 1}`,
          to: `${index + 1}.${i + 1}kn`,
        });
      });
    });
  });

  console.log(linksNodes);

  const childNodeKnowledges = [];
  let knowledgeslink = [];

  parentNodes[0].projects.map((listvalue, i) => {
    listvalue.knowledges.map((item, index) => {
      childNodeKnowledges.push({
        id: `${i + 1}.${index + 1}kn`,
        type: "child",
        concept_proposal_id: listvalue.concept_proposal_id,
        knowledge_id: item.knowledge_id,
        knowledge_name: item.knowledge_name,
        knowledge_detail: item.knowledge_detail,
        lat: parentNodes[0].lat,
        lon: parentNodes[0].lon,
        img: "https://researcher.kims-rmuti.com/icon/knowledge3(1).png",
      });
      listvalue.innovations.map((inno, idx) => {
        knowledgeslink.push({
          from: `${i + 1}.${index + 1}kn`,
          to: `${i + 1}.${idx + 1}in`,
        });
      });
    });
  });
  //   console.log(childNodeKnowledges);
  //   console.log(knowledgeslink);

  const childinnovationNodes = [];
  let innovationslink = [];

  parentNodes[0].projects.map((listvalue, i) => {
    listvalue.innovations.map((item, index) => {
      childinnovationNodes.push({
        id: `${i + 1}.${index + 1}in`,
        type: "child",
        concept_proposal_id: listvalue.concept_proposal_id,
        output_id: item.output_id,
        output_name: item.output_name,
        output_detail: item.output_detail,
        // concept_proposal_name_th: item.concept_proposal_name_th,
        lat: parentNodes[0].lat,
        lon: parentNodes[0].lon,
        img: "https://researcher.kims-rmuti.com/icon/innovation2.png",
      });
      listvalue.newknowledges.map((nkn, idx) => {
        innovationslink.push({
          from: `${i + 1}.${index + 1}in`,
          to: `${i + 1}.${idx + 1}nkn`,
        });
      });
    });
  });
  //   console.log(innovationslink);

  const childNewknowledges = [];
  parentNodes[0].projects.map((listvalue, i) => {
    listvalue.newknowledges.map((item, index) => {
      childNewknowledges.push({
        id: `${i + 1}.${index + 1}nkn`,
        type: "child",
        concept_proposal_id: listvalue.concept_proposal_id,
        outcome_knowledge_id: item.outcome_knowledge_id,
        outcome_knowledge_name: item.outcome_knowledge_name,
        outcome_knowledge_detail: item.outcome_knowledge_detail,
        //   concept_proposal_name_th: item.concept_proposal_name_th,
        lat: parentNodes[0].lat,
        lon: parentNodes[0].lon,
        img: "https://researcher.kims-rmuti.com/icon/new%20knowledge3.png",
      });
    });
  });

  //   console.log(childNewknowledges);

  // let knowledgeslink = [];
  // let innovationslink = [];
  // let newknowledgeslink = [];

  // parentNodes.map((listvalue) => {
  //     listvalue.knowledges.map((kn, id) => {
  //         listvalue.innovation.map((inno, idx) => {
  //             knowledgeslink.push({
  //                 from: `${listvalue.id}.${id + 1}`,
  //                 to: `${listvalue.id}.${idx + 1}in`,
  //             });
  //         });
  //     });

  //     listvalue.innovations.map((kn, idn) => {
  //         listvalue.newknowledges.map((nkn, idnk) => {
  //             innovationslink.push({
  //                 from: `${listvalue.id}.${id + 1}in`,
  //                 to: `${listvalue.id}.${idx + 1}nkn`,
  //             });
  //         });

  //     });

  //     listvalue.newknowledges.map((nkn, idn) => {
  //         listvalue.projects.map((inno, idnk) => {
  //             newknowledgeslink.push({
  //                 from: `${listvalue.id}.${id + 1}nkn`,
  //                 to: `${listvalue.id}.${idx + 1}pj`,
  //             });
  //         });

  //     });

  // });
  // console.log(parentNodes);

  // const groupNodes = helper.groupBy(parentNodes, "concept_proposal_id");
  // console.log("sss", groupNodes);

  // let linkNode = [];
  // const l = groupNodes.map((item) => {
  //     const linknode = item.data.map((link) => {
  //         return { from: link.id, to: link.id + 1 };
  //     });

  //     linknode.pop();

  //     // console.log("sssa", linknode[0]);
  //     if (linknode[0]) {
  //         let lastone = {
  //             from: linknode[0].from,
  //             to: linknode[linknode.length - 1].to,
  //         };
  //         linknode.push(lastone);
  //     }

  //     return { links: linknode };
  // });

  // l.map((item) => {
  //     // item.links.pop();
  //     item.links.map((list) => linkNode.push(list));
  // });

  helper.applyArray(parentNodes, childNodes);
  helper.applyArray(parentNodes, childNodeKnowledges);
  helper.applyArray(parentNodes, childinnovationNodes);
  helper.applyArray(parentNodes, childNewknowledges);

  // helper.applyArray(parentNodes, childNodenewknowledges);

  parentNodes.map((v) => delete v.projects);

  const links = childNodes.map((listvalue) => {
    return {
      from: listvalue.id | 0,
      to: listvalue.id,
    };
  });

  helper.applyArray(links, linksNodes);
  helper.applyArray(links, knowledgeslink);
  helper.applyArray(links, innovationslink);

  return {
    nodes: parentNodes,
    links: links,
  };
}
//องค์ความรู้เก่าดรอป
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
        concept_proposal_name_th: listvalue.concept_proposal_name_th,
        lat: listvalue.concept_proposal_latitude,
        lon: listvalue.concept_proposal_longitude,
        project_type: listvalue.project_type_id,
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
  console.log(co_locations);

  // console.log(concept_proposal_locations);

  const results_locations = await helper.compareArrayToAdd(
    co_locations,
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

  groupCencept.map((v) => {
    if (v.data[0].knowledges.length >= 1 || v.data[0].innovations.length >= 1) {
      const o = v.data.slice(1);
      // console.log(o);
      o.map((item) => {
        item.knowledges = [];
        item.innovations = [];
      });
    }
  });

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
      concept_proposal_id: listvalue.concept_proposal_id,
      concept_proposal_name: listvalue.concept_proposal_name,
      concept_proposal_name_th: listvalue.concept_proposal_name_th,
      lat: listvalue.lat,
      lon: listvalue.lon,
      knowledges: listvalue.knowledges,
      innovations: listvalue.innovations,
      img: `https://researcher.kims-rmuti.com/icon/${
        listvalue.project_type == 1 ? "วิจัย.png" : "บริการ.png"
      }`,
    })
  );

  const childNodes = [];
  parentNodes.map((listvalue) =>
    listvalue.knowledges.map((item, index) =>
      childNodes.push({
        id: `${listvalue.id}.${index + 1}`,
        concept_proposal_id: item.concept_proposal_id,
        type: "child",
        knowledge_id: item.knowledge_id,
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
        concept_proposal_id: item.concept_proposal_id,
        output_id: item.output_id,
        output_name: item.output_name,
        output_detail: item.output_detail,
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: "https://www.km-innovations.rmuti.ac.th/researcher/icon/Innovation-icon%20(2).png",
      })
    )
  );

  // console.log(parentNodes);

  let linksknow = [];
  let linkinno = [];
  parentNodes.map((item) => {
    item.knowledges.map((list, i) => {
      item.innovations.map((listinno, j) => {
        linksknow.push({
          from: `${item.id}.${i + 1}`,
          to: `${item.id}.${j + 1}00`,
        });
      });
    });

    item.innovations.map((listinno, i) => {
      item.innovations.map((list, j) => {
        linkinno.push({
          from: `${item.id}.${i + 1}00`,
          to: `${item.id}.${j + 1}00`,
        });
      });
    });
  });
  console.log(linksknow);

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

  console.log(linkNode);

  helper.applyArray(parentNodes, childNodes);
  helper.applyArray(parentNodes, childNodesInnovations);

  const links = childNodes.map((listvalue) => {
    return {
      from: listvalue.id | 0,
      to: listvalue.id,
    };
  });

  helper.applyArray(links, linksknow);
  helper.applyArray(links, linkNode);
  helper.applyArray(links, linkinno);

  return {
    nodes: parentNodes,
    links: links,
  };
}

//องค์ความรู้ใหม่
async function getnewknowledgegroup(paramsQuery) {
  const rows = await db.query(
    `SELECT progress_report.concept_proposal_id,
            progress_report.progress_report_id,
            progress_report_knowledge_group.knowledge_group_category,
            progress_report_outcome_knowledge.outcome_knowledge_id,
            progress_report_outcome_knowledge.outcome_knowledge_name,
            progress_report_outcome_knowledge.outcome_knowledge_detail
        FROM progress_report_outcome_knowledge
          JOIN progress_report_knowledge_group ON progress_report_knowledge_group.knowledge_group_id = progress_report_outcome_knowledge.knowledge_group_id
          JOIN progress_report_knowledge ON progress_report_knowledge.knowledge_group_id = progress_report_knowledge_group.knowledge_group_id
          JOIN progress_report ON progress_report.progress_report_id = progress_report_knowledge.progress_report_id
        WHERE progress_report_knowledge_group.knowledge_group_category = "${paramsQuery.groupName}"
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
        concept_proposal_name_th: listvalue.concept_proposal_name_th,
        lat: listvalue.concept_proposal_latitude,
        lon: listvalue.concept_proposal_longitude,
        project_type: listvalue.project_type_id,
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
  console.log(co_locations);

  const results = co_locations.map((item) => {
    const arrayResult = data.filter(
      (itemInArray) =>
        itemInArray.concept_proposal_id === item.concept_proposal_id
    );
    return { ...item, new_knowledges: arrayResult };
  });

  const results_innovation = results.map((item) => {
    const arrayResult = output_innovations.filter(
      (itemInArray) =>
        itemInArray.concept_proposal_id === item.concept_proposal_id
    );
    return { ...item, Innovation: arrayResult };
  });

  const groupCencept = helper.groupBy(
    results_innovation,
    "concept_proposal_id"
  );
  groupCencept.map((v) => {
    if (
      v.data[0].new_knowledges.length >= 1 ||
      v.data[0].Innovation.length >= 1
    ) {
      const o = v.data.slice(1);
      // console.log(o);
      o.map((item) => {
        item.new_knowledges = [];
        item.Innovation = [];
      });
    }
  });

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
      new_knowledges: listvalue.new_knowledges,
      knowledges: listvalue.knowledges,
      Innovation: listvalue.Innovation,
      img: `https://researcher.kims-rmuti.com/icon/${
        listvalue.project_type == 1 ? "วิจัย.png" : "บริการ.png"
      }`,
    });
  });

  const childNodes = [];
  parentNodes.map((listvalue) =>
    listvalue.new_knowledges.map((item, index) =>
      childNodes.push({
        id: `${listvalue.id}.${index + 1}`,
        type: "child",
        concept_proposal_id: listvalue.concept_proposal_id,
        outcome_knowledge_id: item.outcome_knowledge_id,
        outcome_knowledge_name: item.outcome_knowledge_name,
        outcome_knowledge_detail: item.outcome_knowledge_detail,
        concept_proposal_name_th: item.concept_proposal_name_th,
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: "https://researcher.kims-rmuti.com/icon/knowledge3(1).png",
      })
    )
  );

  const childinnovationNodes = [];
  parentNodes.map((listvalue) =>
    listvalue.Innovation.map((item, index) =>
      childinnovationNodes.push({
        id: `${listvalue.id}.${index + 1}in`,
        type: "child",
        concept_proposal_id: listvalue.concept_proposal_id,
        output_name: item.output_detail,
        output_id: item.output_id,
        output_detail: item.output_detail,
        concept_proposal_name_th: item.concept_proposal_name_th,
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: "https://researcher.kims-rmuti.com/icon/innovation2.png",
      })
    )
  );

  let newknowledgelink = [];

  parentNodes.map((listvalue) => {
    listvalue.new_knowledges.map((kn, id) => {
      listvalue.Innovation.map((inno, idx) => {
        newknowledgelink.push({
          from: `${listvalue.id}.${id + 1}`,
          to: `${listvalue.id}.${idx + 1}in`,
        });
      });
    });
  });

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
  helper.applyArray(parentNodes, childinnovationNodes);

  const links = childNodes.map((listvalue) => {
    return {
      from: listvalue.id | 0,
      to: listvalue.id,
    };
  });

  helper.applyArray(links, newknowledgelink);
  helper.applyArray(links, linkNode);

  return {
    nodes: parentNodes,
    links: links,
  };

  //   return parentNodes;s
}

async function getKnowledgeGroup() {
  const rows = await db.query(
    `SELECT knowledge_group_id AS value, knowledge_group_category AS label FROM progress_report_knowledge_group`
  );
  const data = helper.emptyOrRows(rows);
  if (data.length) {
    return data;
  }
  return { messages: "not found." };
}

async function getKnowledgeMap(group) {
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
        group.university ? group.university : "u.user_section"
      } 
      AND ( goal.type = ${
        group.impact ? group.impact : "goal.type OR goal.type IS NULL"
      }) 
      AND ( impact.impact_id = ${
        group.goal ? group.goal : "impact.impact_id OR impact.impact_id IS NULL"
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
    let knowledgeData = [],
      innovationData = [],
      outcomeKnowledgeData = [];
    for (let i = 0; i < conceptid.length; i++) {
      const ID = conceptid[i];
      const knowledges = await db.query(`
      SELECT 
          prk.knowledge_id,
          prkg.knowledge_group_id,
          prkg.knowledge_group_category,
          prk.knowledge_name,
          prk.knowledge_image,
          prk.output_id,
          pr.concept_proposal_id
      FROM progress_report_knowledge AS prk 
      LEFT JOIN progress_report AS pr ON pr.progress_report_id = prk.progress_report_id
      LEFT JOIN progress_report_knowledge_group AS prkg ON prkg.knowledge_group_id = prk.knowledge_group_id 
      WHERE concept_proposal_id = ${ID} AND output_id IS NOT NULL AND prkg.knowledge_group_id = ${
        group.knowledgegroup ? group.knowledgegroup : "prkg.knowledge_group_id"
      }`);
      knowledges.map((item) => knowledgeData.push(item));
    }

    const outputId = knowledgeData.map((item) => item.output_id);
    for (let i = 0; i < outputId.length; i++) {
      const ID = outputId[i];
      const innovations = await db.query(
        `SELECT output_id, output_name, output_image FROM progress_report_output WHERE output_id = ${ID}`
      );
      innovations.map((item) => innovationData.push(item));
    }
    console.log(innovationData);

    const outputID = innovationData.map((item) => item.output_id);
    for (let i = 0; i < outputID.length; i++) {
      const ID = outputID[i];
      const newknowledge = await db.query(`
      SELECT 
        outcome.output_id,
        newknowledge.outcome_knowledge_name,
        newknowledge.outcome_knowledge_image
      FROM progress_report_outcome outcome 
      LEFT JOIN progress_report_outcome_knowledge newknowledge ON outcome.outcome_id = newknowledge.outcome_id
      WHERE outcome.outcome_knowledge_group_id NOT IN (24) AND outcome.output_id = '${ID}'`);
      newknowledge.map((item) => outcomeKnowledgeData.push(item));
    }
    console.log(outcomeKnowledgeData);

    const innovation = helper.mergeArrWithSameKey(
      innovationData,
      outcomeKnowledgeData,
      "output_id",
      "newknowledge"
    );

    const knowledge = helper.mergeArrWithSameKey(
      knowledgeData,
      innovation,
      "output_id",
      "innovation"
    );

    const projectConcept = helper.mergeArrWithSameKey(
      arrUniq,
      knowledge,
      "concept_proposal_id",
      "knowledge"
    );

    const filterKnowledge = projectConcept.filter(
      (item) => item.knowledge.length > 0
    );

    let parentNodes = [],
      childNodesKnowledge = [],
      childNodesInnovation = [],
      childNodesNewKnowledge = [],
      parentToknowledgeLink = [],
      knowledgeToInnovationLink = [],
      innovationToNewKnowledgeLink = [];

    filterKnowledge.map((item, index) => {
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

      item.knowledge.map((kitem, kindex) => {
        const KID = kindex + 1;
        childNodesKnowledge.push({
          id: ID + "." + KID,
          type: "child",
          label: "องค์ความรู้เดิม",
          title: kitem.knowledge_name,
          group: kitem.knowledge_group_id,
          lat: item.co_researcher_latitude,
          lon: item.co_researcher_longitude,
          img: "https://researcher.kims-rmuti.com/icon/knowledge3(1).png",
        });

        parentToknowledgeLink.push({
          from: ID,
          to: ID + "." + KID,
        });

        kitem.innovation.map((iitem, iindex) => {
          const IID = iindex + 1;
          childNodesInnovation.push({
            id: ID + "." + KID + "." + IID,
            type: "child",
            label: "นวัตกรรม",
            title: iitem.output_name,
            lat: item.co_researcher_latitude,
            lon: item.co_researcher_longitude,
            img: "https://researcher.kims-rmuti.com/icon/innovation2.png",
          });

          knowledgeToInnovationLink.push({
            from: ID + "." + KID,
            to: ID + "." + KID + "." + IID,
          });

          iitem.newknowledge.map((nitem, nindex) => {
            const NID = nindex + 1;
            childNodesNewKnowledge.push({
              id: ID + "." + KID + "." + IID + "." + NID,
              type: "child",
              label: "องค์ความรู้ใหม่",
              title: nitem.outcome_knowledge_name,
              lat: item.co_researcher_latitude,
              lon: item.co_researcher_longitude,
              img: "https://researcher.kims-rmuti.com/icon/new%20knowledge3.png",
            });

            innovationToNewKnowledgeLink.push({
              from: ID + "." + KID + "." + IID,
              to: ID + "." + KID + "." + IID + "." + NID,
            });
          });
        });
      });
    });

    // console.log(parentNodes);
    // console.log(childNodesKnowledge);
    // console.log(childNodesInnovation);
    // console.log(childNodesNewKnowledge);

    // console.log(parentToknowledgeLink);
    // console.log(knowledgeToInnovationLink);
    // console.log(innovationToNewKnowledgeLink);

    const nodes = [
      ...parentNodes,
      ...childNodesKnowledge,
      ...childNodesInnovation,
      ...childNodesNewKnowledge,
    ];

    const knowledgeGroup = helper.groupBy(childNodesKnowledge, "group");
    const knowledgeGroupsResults = knowledgeGroup.filter(
      (v) => v.data.length >= 2
    );
    const knowledgeGroupLinks = helper.groupLink(knowledgeGroupsResults);

    const links = [
      ...parentToknowledgeLink,
      ...knowledgeToInnovationLink,
      ...innovationToNewKnowledgeLink,
      // ...knowledgeGroupLinks,
    ];

    console.log(knowledgeGroupLinks);

    return {
      nodes: nodes,
      links: links,
      data: {
        countknowledge: childNodesKnowledge.length,
        countinnovation: childNodesInnovation.length,
        countnewknowledge: childNodesNewKnowledge.length,
      },
    };
  }
  return { messages: "not found." };
}

// หน้าแรกของเว็บ life cycle
async function getNewKnowledge(paramsQuery) {
  const rows = await db.query(
    `SELECT pr.concept_proposal_id,
            pr.project_id,
            prok.outcome_knowledge_id, 
            prok.outcome_knowledge_name, 
            prok.outcome_knowledge_detail,
            prok.outcome_knowledge_image,
            prok.outcome_knowledge_video
    FROM progress_report_outcome AS pro 
    INNER JOIN progress_report_outcome_knowledge AS prok
      ON pro.outcome_id = prok.outcome_id
    INNER JOIN progress_report AS pr 
      ON pr.progress_report_id = pro.progress_report_id
    WHERE pr.concept_proposal_id = ${
      paramsQuery.concept_proposal_id
        ? paramsQuery.concept_proposal_id
        : "pr.concept_proposal_id"
    }
    and outcome_knowledge_name is not null
    `
  );
  const data = helper.emptyOrRows(rows);
  // console.log(data);

  let concept_proposal_id = [];
  let project_id = [];
  data.map((listvalue) => {
    concept_proposal_id.push(listvalue.concept_proposal_id);
    project_id.push(listvalue.project_id);
  });
  let cciq = [...new Set(concept_proposal_id)];
  let pjid = [...new Set(project_id)];

  console.log(pjid.filter((x) => x !== null));

  // สร้างตัวเก็บอาเรย์
  let concept_proposal_locations = [];
  let knowledgedata = [];
  let Innovationdata = [];
  // จบการสร้างอาเรย์
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
        concept_proposal_name: listvalue.co_researcher,
        concept_proposal_name_th: listvalue.concept_proposal_name_th,
        project_type: listvalue.project_type_id,
        lat: listvalue.co_researcher_latitude,
        lon: listvalue.co_researcher_longitude,
      })
    );

    console.log(locations);

    // เตรียมข้อมูลออกมาเพื่อทำโหนด

    const knowledge = await db.query(
      `SELECT progress_report.progress_report_id,
              progress_report.concept_proposal_id,
              progress_report_knowledge.knowledge_id,
              progress_report_knowledge.knowledge_name,
              progress_report_knowledge.knowledge_detail,
              progress_report_knowledge_group.knowledge_group_category
      FROM progress_report_knowledge
        JOIN progress_report_knowledge_group ON progress_report_knowledge_group.knowledge_group_id = progress_report_knowledge.knowledge_group_id
        JOIN progress_report ON progress_report.progress_report_id = progress_report_knowledge.progress_report_id
      WHERE progress_report.concept_proposal_id = ${cciq[i]}
      `
    );

    knowledge.map((listvalue) => knowledgedata.push(listvalue));

    // จบตรงนี้1 อาเรย์
    // เตรียมข้อมูลออกมาเพื่อทำโหนด
    const Innovation = await db.query(
      `SELECT progress_report.concept_proposal_id,
              progress_report.progress_report_id,
              progress_report_output.output_id,
              progress_report_output.output_name,
              progress_report_output.output_detail
      FROM progress_report_output
      JOIN progress_report ON progress_report.progress_report_id = progress_report_output.progress_report_id
      
        WHERE progress_report.concept_proposal_id = ${cciq[i]}
        `
    );

    Innovation.map((listvalue) => Innovationdata.push(listvalue));
    // จบตรงนี้1 อาเรย์
  }

  console.log(Innovationdata);

  // console.log(concept_proposal_locations);

  // start here
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
  // console.log(co_locations);

  // end here

  const results = co_locations.map((item) => {
    const arrayResult = data.filter(
      (itemInArray) =>
        itemInArray.concept_proposal_id === item.concept_proposal_id
    );
    return { ...item, new_knowledges: arrayResult };
  });

  // const results_knowledges = results.map((item) => {
  //     const arrayResult = knowledgedata.filter(
  //         (itemInArray) =>
  //             itemInArray.concept_proposal_id === item.concept_proposal_id
  //     );
  //     return { ...item, knowledges: arrayResult };
  // });

  const results_innovation = results.map((item) => {
    const arrayResult = Innovationdata.filter(
      (itemInArray) =>
        itemInArray.concept_proposal_id === item.concept_proposal_id
    );
    return { ...item, Innovation: arrayResult };
  });

  // console.log(results_knowledges);

  const groupCencept = helper.groupBy(
    results_innovation,
    "concept_proposal_id"
  );
  groupCencept.map((v) => {
    if (
      // v.data[0].knowledges.length >= 1 ||
      v.data[0].new_knowledges.length >= 1 ||
      v.data[0].Innovation.length >= 1
    ) {
      const o = v.data.slice(1);
      // console.log(o);
      o.map((item) => {
        // item.knowledges = [];
        item.new_knowledges = [];
        item.Innovation = [];
      });
    }
  });

  // console.log("con", concept);

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
      new_knowledges: listvalue.new_knowledges,
      // knowledges: listvalue.knowledges,
      Innovation: listvalue.Innovation,
      img: `https://researcher.kims-rmuti.com/icon/${
        listvalue.project_type == 1 ? "วิจัย.png" : "บริการ.png"
      }`,
    });
  });

  const childNodes = [];
  parentNodes.map((listvalue) =>
    listvalue.new_knowledges.map((item, index) =>
      childNodes.push({
        id: `${listvalue.id}.${index + 1}`,
        type: "child",
        concept_proposal_id: listvalue.concept_proposal_id,
        outcome_knowledge_id: item.outcome_knowledge_id,
        outcome_knowledge_name: item.outcome_knowledge_name,
        outcome_knowledge_detail: item.outcome_knowledge_detail,
        concept_proposal_name_th: item.concept_proposal_name_th,
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: "https://researcher.kims-rmuti.com/icon/new%20knowledge3.png",
      })
    )
  );

  // const childknowledgeNodes = [];
  // parentNodes.map((listvalue) =>
  //     listvalue.knowledges.map((item, index) =>
  //         childknowledgeNodes.push({
  //             id: `${listvalue.id}.${index + 1}`,
  //             type: "child",
  //             concept_proposal_id: listvalue.concept_proposal_id,
  //             knowledge_name: item.knowledge_name,
  //             knowledge_detail: item.knowledge_detail,
  //             concept_proposal_name_th: item.concept_proposal_name_th,
  //             lat: listvalue.lat,
  //             lon: listvalue.lon,
  //             img: "https://researcher.kims-rmuti.com/icon/knowledge3(1).png",
  //         })
  //     )
  // );

  const childinnovationNodes = [];
  parentNodes.map((listvalue) =>
    listvalue.Innovation.map((item, index) =>
      childinnovationNodes.push({
        id: `${listvalue.id}.${index + 1}in`,
        type: "child",
        concept_proposal_id: listvalue.concept_proposal_id,
        output_id: item.output_id,
        output_name: item.output_name,
        output_detail: item.output_detail,
        concept_proposal_name_th: item.concept_proposal_name_th,
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: "https://researcher.kims-rmuti.com/icon/innovation2.png",
      })
    )
  );
  let knowledgelink = [];
  // let Innovationlink = [];

  parentNodes.map((listvalue) => {
    listvalue.new_knowledges.map((kn, id) => {
      listvalue.Innovation.map((inno, idx) => {
        knowledgelink.push({
          from: `${listvalue.id}.${id + 1}`,
          to: `${listvalue.id}.${idx + 1}in`,
        });
      });
    });

    // listvalue.Innovation.map((inno, idx) => {
    //     listvalue.new_knowledges.map((nkn, idy) => {
    //         Innovationlink.push({
    //             from: `${listvalue.id}.${idx + 1}in`,
    //             to: `${listvalue.id}.${idy + 1}nkn`,
    //         });
    //     });
    // });
  });

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

  // console.log(linkNode);

  // linkfrom.pop();
  // linkto.shift();

  // let linksNodes = linkfrom.map((item, i) =>
  //   Object.assign({}, item, linkto[i])
  // );

  // console.log(linkfrom);

  helper.applyArray(parentNodes, childNodes);
  // helper.applyArray(parentNodes, childknowledgeNodes);
  helper.applyArray(parentNodes, childinnovationNodes);

  const links = childNodes.map((listvalue) => {
    return {
      from: listvalue.id | 0,
      to: listvalue.id,
    };
  });

  helper.applyArray(links, linkNode);
  helper.applyArray(links, knowledgelink);
  // helper.applyArray(links, Innovationlink);

  return {
    nodes: parentNodes,
    links: links,
  };

  // return parentNodes;
}

async function getKnowledge() {
  const rows = await db.query(
    `SELECT pr.concept_proposal_id,
              pr.project_id,
              prok.outcome_knowledge_name, 
              prok.outcome_knowledge_id,
              prok.outcome_knowledge_detail,
              prok.outcome_knowledge_image,
              prok.outcome_knowledge_video
      FROM progress_report_outcome AS pro 
      INNER JOIN progress_report_outcome_knowledge AS prok
        ON pro.outcome_id = prok.outcome_id
      INNER JOIN progress_report AS pr 
        ON pr.progress_report_id = pro.progress_report_id
        where outcome_knowledge_name is not null
      `
  );
  const data = helper.emptyOrRows(rows);
  // console.log(data);

  let concept_proposal_id = [];
  let project_id = [];
  data.map((listvalue) => {
    concept_proposal_id.push(listvalue.concept_proposal_id);
    project_id.push(listvalue.project_id);
  });
  let cciq = [...new Set(concept_proposal_id)];
  let pjid = [...new Set(project_id)];

  console.log(cciq);

  // console.log(pjid.filter((x) => x !== null));

  // สร้างตัวเก็บอาเรย์
  let concept_proposal_locations = [];
  let knowledgedata = [];
  let Innovationdata = [];
  // จบการสร้างอาเรย์
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
        concept_proposal_name: listvalue.co_researcher,
        concept_proposal_name_th: listvalue.concept_proposal_name_th,
        project_type: listvalue.project_type_id,
        lat: listvalue.co_researcher_latitude,
        lon: listvalue.co_researcher_longitude,
      })
    );

    console.log(data);

    // เตรียมข้อมูลออกมาเพื่อทำโหนด

    const knowledge = await db.query(
      `SELECT progress_report.progress_report_id,
              progress_report.concept_proposal_id,
              progress_report_knowledge.knowledge_id,
              progress_report_knowledge.knowledge_name,
              progress_report_knowledge.knowledge_image,
              progress_report_knowledge.knowledge_detail,
              progress_report_knowledge_group.knowledge_group_category
        FROM progress_report_knowledge
          JOIN progress_report_knowledge_group ON progress_report_knowledge_group.knowledge_group_id = progress_report_knowledge.knowledge_group_id
          JOIN progress_report ON progress_report.progress_report_id = progress_report_knowledge.progress_report_id
        WHERE progress_report.concept_proposal_id = ${cciq[i]}
        `
    );

    knowledge.map((listvalue) => knowledgedata.push(listvalue));

    // จบตรงนี้1 อาเรย์
    // เตรียมข้อมูลออกมาเพื่อทำโหนด
    const Innovation = await db.query(
      `SELECT  progress_report.concept_proposal_id,
               progress_report.progress_report_id,
               progress_report_output.output_name,
               progress_report_output.output_id,
               progress_report_output.output_image
        ,progress_report_output.output_detail
        FROM progress_report_output
        JOIN progress_report ON progress_report.progress_report_id = progress_report_output.progress_report_id
        
          WHERE progress_report.concept_proposal_id = ${cciq[i]}
          `
    );

    Innovation.map((listvalue) => Innovationdata.push(listvalue));
    // จบตรงนี้1 อาเรย์
  }

  // console.log(Innovationdata);

  // console.log(concept_proposal_locations);

  // start here
  const newlocation = helper.groupBy(
    concept_proposal_locations,
    "concept_proposal_id"
  );

  // console.log(newlocation);
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

  // end here

  const results = co_locations.map((item) => {
    const arrayResult = data.filter(
      (itemInArray) =>
        itemInArray.concept_proposal_id === item.concept_proposal_id
    );
    return { ...item, new_knowledges: arrayResult };
  });

  const results_knowledges = results.map((item) => {
    const arrayResult = knowledgedata.filter(
      (itemInArray) =>
        itemInArray.concept_proposal_id === item.concept_proposal_id
    );
    return { ...item, knowledges: arrayResult };
  });

  const results_innovation = results_knowledges.map((item) => {
    const arrayResult = Innovationdata.filter(
      (itemInArray) =>
        itemInArray.concept_proposal_id === item.concept_proposal_id
    );
    return { ...item, Innovation: arrayResult };
  });

  // console.log(results_knowledges);

  const groupCencept = helper.groupBy(
    results_innovation,
    "concept_proposal_id"
  );
  groupCencept.map((v) => {
    if (
      v.data[0].knowledges.length >= 1 ||
      v.data[0].new_knowledges.length >= 1 ||
      v.data[0].Innovation.length >= 1
    ) {
      const o = v.data.slice(1);
      // console.log(o);
      o.map((item) => {
        item.knowledges = [];
        item.new_knowledges = [];
        item.Innovation = [];
      });
    }
  });

  // console.log("con", concept);

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
      new_knowledges: listvalue.new_knowledges,
      knowledges: listvalue.knowledges,
      Innovation: listvalue.Innovation,
      img: `https://researcher.kims-rmuti.com/icon/${
        listvalue.project_type == 1 ? "วิจัย.png" : "บริการ.png"
      }`,
    });
  });

  const childNodes = [];
  parentNodes.map((listvalue) =>
    listvalue.new_knowledges.map((item, index) =>
      childNodes.push({
        id: `${listvalue.id}.${index + 1}nkn`,
        type: "child",
        concept_proposal_id: listvalue.concept_proposal_id,
        outcome_knowledge_id: item.outcome_knowledge_id,
        outcome_knowledge_image: item.outcome_knowledge_image,
        outcome_knowledge_name: item.outcome_knowledge_name,
        outcome_knowledge_detail: item.outcome_knowledge_detail,
        concept_proposal_name_th: item.concept_proposal_name_th,
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: "https://researcher.kims-rmuti.com/icon/new%20knowledge3.png",
      })
    )
  );

  const childknowledgeNodes = [];
  parentNodes.map((listvalue) =>
    listvalue.knowledges.map((item, index) =>
      childknowledgeNodes.push({
        id: `${listvalue.id}.${index + 1}`,
        type: "child",
        concept_proposal_id: listvalue.concept_proposal_id,
        knowledge_id: item.knowledge_id,
        knowledge_name: item.knowledge_name,
        knowledge_detail: item.knowledge_detail,
        knowledge_image: item.knowledge_image,
        concept_proposal_name_th: item.concept_proposal_name_th,
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: "https://researcher.kims-rmuti.com/icon/knowledge3(1).png",
      })
    )
  );

  const childinnovationNodes = [];
  parentNodes.map((listvalue) =>
    listvalue.Innovation.map((item, index) =>
      childinnovationNodes.push({
        id: `${listvalue.id}.${index + 1}in`,
        type: "child",
        concept_proposal_id: listvalue.concept_proposal_id,
        output_id: item.output_id,
        output_image: item.output_image,
        output_name: item.output_detail,
        output_detail: item.output_detail,
        concept_proposal_name_th: item.concept_proposal_name_th,
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: "https://researcher.kims-rmuti.com/icon/innovation2.png",
      })
    )
  );
  let knowledgelink = [];
  let Innovationlink = [];

  parentNodes.map((listvalue) => {
    listvalue.knowledges.map((kn, id) => {
      listvalue.Innovation.map((inno, idx) => {
        knowledgelink.push({
          from: `${listvalue.id}.${id + 1}`,
          to: `${listvalue.id}.${idx + 1}in`,
        });
      });
    });

    listvalue.Innovation.map((inno, idx) => {
      listvalue.new_knowledges.map((nkn, idy) => {
        Innovationlink.push({
          from: `${listvalue.id}.${idx + 1}in`,
          to: `${listvalue.id}.${idy + 1}nkn`,
        });
      });
    });
  });

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
    // item.links.pop();
    item.links.map((list) => linkNode.push(list));
  });

  // console.log(linkNode);

  // linkfrom.pop();
  // linkto.shift();

  // let linksNodes = linkfrom.map((item, i) =>
  //   Object.assign({}, item, linkto[i])
  // );

  // console.log(linkfrom);

  helper.applyArray(parentNodes, childNodes);
  helper.applyArray(parentNodes, childknowledgeNodes);
  helper.applyArray(parentNodes, childinnovationNodes);

  const links = childknowledgeNodes.map((listvalue) => {
    return {
      from: listvalue.id | 0,
      to: listvalue.id,
    };
  });

  helper.applyArray(links, linkNode);
  helper.applyArray(links, knowledgelink);
  helper.applyArray(links, Innovationlink);

  return {
    nodes: parentNodes,
    links: links,
  };

  // return parentNodes;
}

module.exports = {
  getKnowledge,
  getNewKnowledge,
  getKnowledgeByGrouup,
  getOutput,
  getImpact,
  getGoal,
  getnewknowledgegroup,
  getCampusGroup,
  getKnowledgeGroup,
  getKnowledgeMap,
};

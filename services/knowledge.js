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
        knowledge_name: listvalue.knowledge_name,
        knowledge_detail: listvalue.knowledge_detail,
      })
    );
  }

  // console.log(knowledges);

  const results_locations = await helper.compareArrayToAdd(
    concept_proposal_locations,
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
      img: `https://www.km-innovations.rmuti.ac.th/researcher/icon/${
        listvalue.project_type == 1 ? "research.png" : "บริการวิชาการ.png"
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
        output_name: item.output_name,
        output_detail: item.output_detail,
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: "https://www.km-innovations.rmuti.ac.th/researcher/icon/Innovation-icon%20(2).png",
      });
    });
    listvalue.knowledges.map((item, index) => {
      childNodeKnowledge.push({
        id: `${listvalue.id}.${index + 1}xn`,
        type: "child",
        concept_proposal_id: item.concept_proposal_id,
        knowledge_name: item.knowledge_name,
        knowledge_detail: item.knowledge_detail,
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: "https://www.km-innovations.rmuti.ac.th/researcher/icon/knowledge-icon.png",
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

  // let knowledges = [];
  // for (let i = 0; i < priq.length; i++) {
  //   const rows = await db.query(
  //     `SELECT progress_report_knowledge.knowledge_id,
  //             progress_report_knowledge.knowledge_name,
  //             progress_report_knowledge.knowledge_detail,
  //             progress_report.concept_proposal_id,
  //             progress_report.progress_report_id
  //       FROM progress_report_knowledge
  //     INNER JOIN progress_report ON progress_report.progress_report_id = progress_report_knowledge.progress_report_id
  //     WHERE progress_report_knowledge.progress_report_id = ${priq[i]} `
  //   );
  //   const data = helper.emptyOrRows(rows);
  //   data.map((item) => knowledges.push(item));
  // }

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

    // const rows_innovations = await db.query(
    //   `SELECT * FROM progress_report_output INNER JOIN progress_report
    //       ON progress_report.progress_report_id = progress_report_output.progress_report_id
    //     WHERE progress_report.concept_proposal_id = ${cciq[i]}`
    // );

    // const data1 = helper.emptyOrRows(rows_innovations);
    // data1.map((listvalue) => {
    //   innovations.push({
    //     output_id: listvalue.output_id,
    //     concept_proposal_id: listvalue.concept_proposal_id,
    //     progress_report_id: listvalue.progress_report_id,
    //     output_name: listvalue.output_name,
    //     output_detail: listvalue.output_detail,
    //   });
    // });
  }

  // const results_locations = await helper.compareArrayToAdd(
  //   locations,
  //   knowledges,
  //   "concept_proposal_id"
  // );

  // const results_innovations = await helper.compareArrayToAdd(
  //   results_locations,
  //   innovations,
  //   "concept_proposal_id"
  // );

  const goalPoint = async () => {
    if (paramsQuery.goal_id == 1) {
      return await helper.compareArrayToAdd(
        locations,
        bcg_array,
        "concept_proposal_id"
      );
    }
    if (paramsQuery.goal_id == 2) {
      return await helper.compareArrayToAdd(
        locations,
        sdgs_array,
        "concept_proposal_id"
      );
    }
    if (paramsQuery.goal_id == 3) {
      return await helper.compareArrayToAdd(
        locations,
        curve_array,
        "concept_proposal_id"
      );
    }
    if (paramsQuery.goal_id == 4) {
      return await helper.compareArrayToAdd(
        locations,
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
          img: `https://www.km-innovations.rmuti.ac.th/researcher/icon/${
            listvalue.project_type == 1 ? "research.png" : "บริการวิชาการ.png"
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
  // parentNodes.map((item, i) => {
  //   item[
  //     `${
  //       paramsQuery.goal_id == 1
  //         ? "bcg"
  //         : paramsQuery.goal_id == 2
  //         ? "sdgs"
  //         : paramsQuery.goal_id == 3
  //         ? "curve"
  //         : paramsQuery.goal_id == 4
  //         ? "cluster"
  //         : ""
  //     }`
  //   ].map((list, j) => {
  //     linkconcept.push({
  //       from: `${item.id}.${i + 1}`,
  //       to: `${item.id}.${j + 1}xxx`,
  //     });
  //   });
  //   // item.knowledges.map((list, j) => {
  //   //   linkconcept.push({
  //   //     from: `${item.id}.${i + 1}`,
  //   //     to: `${item.id}.${j + 1}xn`,
  //   //   });
  //   // });

  //   // item.knowledges.map((list, i) => {
  //   //   item.innovations.map((listinno, j) => {
  //   //     linksknow.push({
  //   //       from: `${item.id}.${i + 1}xn`,
  //   //       to: `${item.id}.${j + 1}xx`,
  //   //     });
  //   //   });
  //   // });

  //   // item.innovations.map((listitem, i) => {
  //   //   item[
  //   //     `${
  //   //       paramsQuery.goal_id == 1
  //   //         ? "bcg"
  //   //         : paramsQuery.goal_id == 2
  //   //         ? "sdgs"
  //   //         : paramsQuery.goal_id == 3
  //   //         ? "curve"
  //   //         : paramsQuery.goal_id == 4
  //   //         ? "cluster"
  //   //         : ""
  //   //     }`
  //   //   ].map((list, j) => {
  //   //     linkgoal.push({
  //   //       from: `${item.id}.${i + 1}xx`,
  //   //       to: `${item.id}.${j + 1}xxx`,
  //   //     });
  //   //   });
  //   // });
  // });

  // helper.applyArray(parentNodes, childNodes);
  // helper.applyArray(parentNodes, childNodesInnovations);

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

  // helper.applyArray(links, linksknow);
  // helper.applyArray(links, linkgoal);
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
    return { [index + 1]: list.impact_name };
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

  // console.log(final_impact);

  // let knowledges = [];
  // for (let i = 0; i < priq.length; i++) {
  //   const rows = await db.query(
  //     `SELECT progress_report_knowledge.knowledge_id,
  //             progress_report_knowledge.knowledge_name,
  //             progress_report_knowledge.knowledge_detail,
  //             progress_report.concept_proposal_id,
  //             progress_report.progress_report_id
  //       FROM progress_report_knowledge
  //     INNER JOIN progress_report ON progress_report.progress_report_id = progress_report_knowledge.progress_report_id
  //     WHERE progress_report_knowledge.progress_report_id = ${priq[i]} `
  //   );
  //   const data = helper.emptyOrRows(rows);
  //   data.map((item) => knowledges.push(item));
  // }

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

    

    // const rows_innovations = await db.query(
    //   `SELECT * FROM progress_report_output INNER JOIN progress_report
    //       ON progress_report.progress_report_id = progress_report_output.progress_report_id
    //     WHERE progress_report.concept_proposal_id = ${cciq[i]}`
    // );

    // const data1 = helper.emptyOrRows(rows_innovations);
    // data1.map((listvalue) => {
    //   innovations.push({
    //     output_id: listvalue.output_id,
    //     concept_proposal_id: listvalue.concept_proposal_id,
    //     progress_report_id: listvalue.progress_report_id,
    //     output_name: listvalue.output_name,
    //     output_detail: listvalue.output_detail,
    //   });
    // });
  }

  // const results_locations = await helper.compareArrayToAdd(
  //   locations,
  //   knowledges,
  //   "concept_proposal_id"
  // );

  // const results_innovations = await helper.compareArrayToAdd(
  //   results_locations,
  //   innovations,
  //   "concept_proposal_id"
  // );

  // const results = await helper.compareArrayToAdd(
  //   results_innovations,
  //   final_impact,
  //   "concept_proposal_id"
  // );

  const results = await helper.compareArrayToAdd(
    locations,
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
      img: `https://www.km-innovations.rmuti.ac.th/researcher/icon/${
        listvalue.project_type == 1 ? "research.png" : "บริการวิชาการ.png"
      }`,
    })
  );

  const childNodes = [];
  const childNodesConcepts = [];
  const childNodesInnovations = [];
  const childNodeImpacts = [];
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
  // parentNodes.map((item, i) => {
  //   item.impacts.map((list, j) => {
  //     linkconcept.push({
  //       from: `${item.id}.${i + 1}`,
  //       to: `${item.id}.${j + 1}xxx`,
  //     });
  //   });
  //   // item.knowledges.map((list, j) => {
  //   //   linkconcept.push({
  //   //     from: `${item.id}.${i + 1}`,
  //   //     to: `${item.id}.${j + 1}xn`,
  //   //   });
  //   // });

  //   // item.knowledges.map((list, i) => {
  //   //   item.innovations.map((listinno, j) => {
  //   //     linksknow.push({
  //   //       from: `${item.id}.${i + 1}xn`,
  //   //       to: `${item.id}.${j + 1}xx`,
  //   //     });
  //   //   });
  //   // });

  //   // item.innovations.map((listitem, i) => {
  //   //   item.impacts.map((list, j) => {
  //   //     linkimpact.push({
  //   //       from: `${item.id}.${i + 1}xx`,
  //   //       to: `${item.id}.${j + 1}xxx`,
  //   //     });
  //   //   });
  //   // });
  // });
  // console.log(linksknow);
  // console.log(linkimpact);

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
      img: `https://www.km-innovations.rmuti.ac.th/researcher/icon/${
        listvalue.project_type == 1 ? "research.png" : "บริการวิชาการ.png"
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
        concept_proposal_name_th: listvalue.concept_proposal_name_th,
        project_type: listvalue.project_type_id,
        lat: listvalue.concept_proposal_latitude,
        lon: listvalue.concept_proposal_longitude,
      })
    );
  }

  const newproposal = helper.groupBy (concept_proposal_locations,"conconcept_proposal_id")
  console.log(newproposal);

  const results = concept_proposal_locations.map((item) => {
    const arrayResult = data.filter(
      (itemInArray) =>
        itemInArray.concept_proposal_id === item.concept_proposal_id
    );
    return { ...item, new_knowledges: arrayResult };
  });

  const groupCencept = helper.groupBy(results, "concept_proposal_id");
  groupCencept.map((v) => {
    if (v.data[0].new_knowledges.length >= 1) {
      const o = v.data.slice(1);
      // console.log(o);
      o.map((item) => {
        item.new_knowledges = [];
      });
    }
  });

  // console.log("con", concept);

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
      new_knowledges: listvalue.new_knowledges,
      img: `https://www.km-innovations.rmuti.ac.th/researcher/icon/${
        listvalue.project_type == 1 ? "research.png" : "บริการวิชาการ.png"
      }`,
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
        concept_proposal_name_th: item.concept_proposal_name_th,
        lat: listvalue.lat,
        lon: listvalue.lon,
        img: "https://www.km-innovations.rmuti.ac.th/researcher/icon/New-knowledge-icon.png",
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

  console.log(linkNode);

  // linkfrom.pop();
  // linkto.shift();

  // let linksNodes = linkfrom.map((item, i) =>
  //   Object.assign({}, item, linkto[i])
  // );

  // console.log(linkfrom);

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

  // return parentNodes;
}

module.exports = {
  getNewKnowledge,
  getKnowledge,
  getKnowledgeByGrouup,
  getOutput,
  getImpact,
  getGoal,
};
